// Event Dispatcher - Fase 2 of the operational system
// Scans events_outbox + runs detection scans, routes events to handlers.
// Invoked by pg_cron every minute. Public endpoint (uses CRON_SECRET).
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 100;

type EventRow = {
  id: string;
  event_type: string;
  user_id: string | null;
  lead_id: string | null;
  data: Record<string, unknown>;
  attempts: number;
};

// ---------------- Detection scans ----------------
async function scanOverdueLeads(db: SupabaseClient) {
  // Leads whose next_action_at is in the past, status ATIVO,
  // and that haven't emitted lead.became_overdue in the last 12h.
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: leads } = await db
    .from("leads")
    .select("id, user_id, next_action_at")
    .eq("status_final", "ATIVO")
    .lt("next_action_at", new Date().toISOString())
    .limit(500);
  if (!leads?.length) return 0;

  const ids = leads.map((l) => l.id);
  const { data: recent } = await db
    .from("events_outbox")
    .select("lead_id")
    .eq("event_type", "lead.became_overdue")
    .in("lead_id", ids)
    .gte("occurred_at", since);
  const skip = new Set((recent ?? []).map((r) => r.lead_id));
  const toEmit = leads.filter((l) => !skip.has(l.id));
  if (!toEmit.length) return 0;

  const rows = toEmit.map((l) => ({
    event_type: "lead.became_overdue",
    user_id: l.user_id,
    lead_id: l.id,
    data: {
      hours_overdue: Math.floor(
        (Date.now() - new Date(l.next_action_at).getTime()) / 3_600_000,
      ),
    },
  }));
  await db.from("events_outbox").insert(rows);
  return rows.length;
}

async function scanProposalsNoResponse(db: SupabaseClient) {
  // proposal.sent older than 48h with no inbound interaction since.
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: proposals } = await db
    .from("events_outbox")
    .select("lead_id, user_id, occurred_at")
    .eq("event_type", "proposal.sent")
    .lt("occurred_at", cutoff)
    .gte("occurred_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .limit(200);
  if (!proposals?.length) return 0;

  let emitted = 0;
  for (const p of proposals) {
    if (!p.lead_id) continue;
    // Already alerted recently?
    const { count: recentAlert } = await db
      .from("events_outbox")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "proposal.no_response")
      .eq("lead_id", p.lead_id)
      .gte("occurred_at", since24h);
    if ((recentAlert ?? 0) > 0) continue;
    // Inbound after proposal?
    const { count: inbound } = await db
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", p.lead_id)
      .eq("direction", "IN")
      .gte("created_at", p.occurred_at);
    if ((inbound ?? 0) > 0) continue;
    await db.from("events_outbox").insert({
      event_type: "proposal.no_response",
      user_id: p.user_id,
      lead_id: p.lead_id,
      data: { proposal_at: p.occurred_at },
    });
    emitted++;
  }
  return emitted;
}

async function scanGoneCold(db: SupabaseClient) {
  // ATIVO leads with last_touch_at older than 7 days, not recently flagged.
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads } = await db
    .from("leads")
    .select("id, user_id, last_touch_at, stage")
    .eq("status_final", "ATIVO")
    .lt("last_touch_at", cutoff)
    .limit(300);
  if (!leads?.length) return 0;
  const ids = leads.map((l) => l.id);
  const { data: recent } = await db
    .from("events_outbox")
    .select("lead_id")
    .eq("event_type", "lead.gone_cold")
    .in("lead_id", ids)
    .gte("occurred_at", since);
  const skip = new Set((recent ?? []).map((r) => r.lead_id));
  const toEmit = leads.filter((l) => !skip.has(l.id));
  if (!toEmit.length) return 0;
  await db.from("events_outbox").insert(
    toEmit.map((l) => ({
      event_type: "lead.gone_cold",
      user_id: l.user_id,
      lead_id: l.id,
      data: { last_touch_at: l.last_touch_at, stage: l.stage },
    })),
  );
  return toEmit.length;
}

async function scanChurnRisk(db: SupabaseClient) {
  // Clients (CONVERTIDO) in RECORRENCIA with no touch > 14d
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: clients } = await db
    .from("leads")
    .select("id, user_id, last_touch_at")
    .eq("status_final", "CONVERTIDO")
    .eq("stage", "RECORRENCIA")
    .lt("last_touch_at", cutoff)
    .limit(300);
  if (!clients?.length) return 0;
  const ids = clients.map((c) => c.id);
  const { data: recent } = await db
    .from("events_outbox")
    .select("lead_id")
    .eq("event_type", "client.churn_risk")
    .in("lead_id", ids)
    .gte("occurred_at", since);
  const skip = new Set((recent ?? []).map((r) => r.lead_id));
  const toEmit = clients.filter((c) => !skip.has(c.id));
  if (!toEmit.length) return 0;
  await db.from("events_outbox").insert(
    toEmit.map((c) => ({
      event_type: "client.churn_risk",
      user_id: c.user_id,
      lead_id: c.id,
      data: {
        days_since_touch: Math.floor(
          (Date.now() - new Date(c.last_touch_at!).getTime()) / 86_400_000,
        ),
      },
    })),
  );
  return toEmit.length;
}

// ---------------- Handlers ----------------
async function ensureSystemTask(
  db: SupabaseClient,
  params: {
    user_id: string;
    lead_id: string;
    title: string;
    action_type: string;
    priority: "P1" | "P2" | "P3" | "P4";
    note: string;
    dedupe_key: string; // skip if open task with same marker exists
    due_in_hours?: number;
  },
) {
  const marker = `🤖 [${params.dedupe_key}]`;
  const { count } = await db
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", params.lead_id)
    .eq("status", "OPEN")
    .ilike("note", `%${marker}%`);
  if ((count ?? 0) > 0) return false;
  const due = new Date(Date.now() + (params.due_in_hours ?? 1) * 3_600_000)
    .toISOString();
  await db.from("tasks").insert({
    user_id: params.user_id,
    lead_id: params.lead_id,
    title: params.title,
    action_type: params.action_type,
    priority: params.priority,
    status: "OPEN",
    due_at: due,
    note: `${marker}\n${params.note}`,
  });
  return true;
}

async function handleEvent(db: SupabaseClient, ev: EventRow): Promise<void> {
  if (!ev.user_id || !ev.lead_id) return;
  switch (ev.event_type) {
    case "lead.became_overdue": {
      const hours = Number(ev.data?.hours_overdue ?? 0);
      await ensureSystemTask(db, {
        user_id: ev.user_id,
        lead_id: ev.lead_id,
        title: `Follow-up vencido há ${hours}h`,
        action_type: "WHATSAPP",
        priority: "P1",
        note: "Lead com ação vencida. Retomar contato imediatamente.",
        dedupe_key: "OVERDUE",
      });
      break;
    }
    case "proposal.no_response": {
      await ensureSystemTask(db, {
        user_id: ev.user_id,
        lead_id: ev.lead_id,
        title: "Proposta sem resposta há 48h",
        action_type: "WHATSAPP",
        priority: "P1",
        note: "Sondar percepção da proposta. Identificar objeções.",
        dedupe_key: "PROPOSAL_NO_RESP",
      });
      break;
    }
    case "lead.gone_cold": {
      await ensureSystemTask(db, {
        user_id: ev.user_id,
        lead_id: ev.lead_id,
        title: "Lead frio: reativar",
        action_type: "WHATSAPP",
        priority: "P2",
        note: "Sem contato há 7+ dias. Tentar reativação leve.",
        dedupe_key: "GONE_COLD",
      });
      break;
    }
    case "client.churn_risk": {
      const days = Number(ev.data?.days_since_touch ?? 0);
      await ensureSystemTask(db, {
        user_id: ev.user_id,
        lead_id: ev.lead_id,
        title: `Cliente em risco (${days}d sem contato)`,
        action_type: "WHATSAPP",
        priority: "P1",
        note: "Cliente em RECORRÊNCIA inativo. Oferecer reposição/novidade.",
        dedupe_key: "CHURN_RISK",
      });
      break;
    }
    default:
      // No handler — ack silently.
      return;
  }
}

// ---------------- Main loop ----------------
async function processOutbox(db: SupabaseClient) {
  const { data: events } = await db
    .from("events_outbox")
    .select("id, event_type, user_id, lead_id, data, attempts")
    .is("processed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("occurred_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (!events?.length) return { processed: 0, failed: 0, dead: 0 };

  let processed = 0, failed = 0, dead = 0;
  for (const ev of events as EventRow[]) {
    try {
      await handleEvent(db, ev);
      await db
        .from("events_outbox")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", ev.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const nextAttempts = ev.attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        await db.from("events_dead_letter").insert({
          original_event_id: ev.id,
          event_type: ev.event_type,
          user_id: ev.user_id,
          lead_id: ev.lead_id,
          data: ev.data,
          attempts: nextAttempts,
          last_error: msg,
        });
        await db
          .from("events_outbox")
          .update({
            attempts: nextAttempts,
            last_error: msg,
            processed_at: new Date().toISOString(),
          })
          .eq("id", ev.id);
        dead++;
      } else {
        await db
          .from("events_outbox")
          .update({ attempts: nextAttempts, last_error: msg })
          .eq("id", ev.id);
        failed++;
      }
    }
  }
  return { processed, failed, dead };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // Shared-secret auth so cron and admins can invoke.
    const secret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!secret || provided !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const url = new URL(req.url);
    const skipScans = url.searchParams.get("skip_scans") === "1";

    const scans = skipScans
      ? { overdue: 0, proposals: 0, cold: 0, churn: 0 }
      : {
        overdue: await scanOverdueLeads(db),
        proposals: await scanProposalsNoResponse(db),
        cold: await scanGoneCold(db),
        churn: await scanChurnRisk(db),
      };

    const result = await processOutbox(db);

    return new Response(
      JSON.stringify({ ok: true, scans, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("dispatcher error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
