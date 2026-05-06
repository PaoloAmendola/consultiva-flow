
-- ============================================================
-- FASE 1: Event-driven backbone + bug fixes + RLS hardening
-- ============================================================

-- 1. Extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. BUG FIX: Reattach trigger that auto-updates last_touch_at
DROP TRIGGER IF EXISTS interactions_update_lead_last_touch ON public.interactions;
CREATE TRIGGER interactions_update_lead_last_touch
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.update_lead_last_touch();

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_status_nextaction
  ON public.leads (user_id, status_final, next_action_at);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_created
  ON public.interactions (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due
  ON public.tasks (user_id, status, due_at);

-- ============================================================
-- 4. EVENT OUTBOX
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  lead_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  processed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_outbox_pending
  ON public.events_outbox (occurred_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_outbox_type
  ON public.events_outbox (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_outbox_lead
  ON public.events_outbox (lead_id, occurred_at DESC);

ALTER TABLE public.events_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own events"
  ON public.events_outbox FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Dead letter
CREATE TABLE IF NOT EXISTS public.events_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID,
  lead_id UUID,
  data JSONB NOT NULL,
  attempts INT NOT NULL,
  last_error TEXT,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events_dead_letter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view dead letter"
  ON public.events_dead_letter FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. NBA DECISIONS history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nba_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  priority TEXT NOT NULL,
  suggested_action TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_nba_decisions_lead
  ON public.nba_decisions (lead_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_nba_decisions_user_open
  ON public.nba_decisions (user_id, fired_at DESC)
  WHERE dismissed_at IS NULL AND acted_at IS NULL;

ALTER TABLE public.nba_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own nba decisions"
  ON public.nba_decisions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own nba decisions"
  ON public.nba_decisions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. AI RECOMMENDATIONS history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'sales-coach',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  ignored_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_rec_lead
  ON public.ai_recommendations (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_rec_user_open
  ON public.ai_recommendations (user_id, created_at DESC)
  WHERE accepted_at IS NULL AND ignored_at IS NULL;

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai recs"
  ON public.ai_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own ai recs"
  ON public.ai_recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. OUTBOX EMITTER FUNCTION + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.emit_event(
  _event_type TEXT,
  _user_id UUID,
  _lead_id UUID,
  _data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.events_outbox (event_type, user_id, lead_id, data)
  VALUES (_event_type, _user_id, _lead_id, COALESCE(_data, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Lead lifecycle events
CREATE OR REPLACE FUNCTION public.trg_leads_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.emit_event('lead.created', NEW.user_id, NEW.id,
      jsonb_build_object('origin', NEW.origin, 'lead_type', NEW.lead_type, 'stage', NEW.stage));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.stage IS DISTINCT FROM OLD.stage THEN
      PERFORM public.emit_event('lead.stage_changed', NEW.user_id, NEW.id,
        jsonb_build_object('from', OLD.stage, 'to', NEW.stage));
    END IF;
    IF NEW.status_final IS DISTINCT FROM OLD.status_final THEN
      PERFORM public.emit_event('lead.status_changed', NEW.user_id, NEW.id,
        jsonb_build_object('from', OLD.status_final, 'to', NEW.status_final));
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      PERFORM public.emit_event('lead.priority_changed', NEW.user_id, NEW.id,
        jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS leads_emit_events ON public.leads;
CREATE TRIGGER leads_emit_events
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_leads_emit_events();

-- Interactions events
CREATE OR REPLACE FUNCTION public.trg_interactions_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.emit_event('interaction.logged', NEW.user_id, NEW.lead_id,
    jsonb_build_object('type', NEW.type, 'direction', NEW.direction, 'asset_sent', NEW.asset_sent));
  IF NEW.type = 'ENVIAR_PROPOSTA' AND NEW.direction = 'OUT' THEN
    PERFORM public.emit_event('proposal.sent', NEW.user_id, NEW.lead_id,
      jsonb_build_object('asset_sent', NEW.asset_sent));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS interactions_emit_events ON public.interactions;
CREATE TRIGGER interactions_emit_events
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.trg_interactions_emit_events();

-- Tasks events
CREATE OR REPLACE FUNCTION public.trg_tasks_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.emit_event('task.created', NEW.user_id, NEW.lead_id,
      jsonb_build_object('task_id', NEW.id, 'action_type', NEW.action_type, 'priority', NEW.priority));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.emit_event('task.status_changed', NEW.user_id, NEW.lead_id,
      jsonb_build_object('task_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tasks_emit_events ON public.tasks;
CREATE TRIGGER tasks_emit_events
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_emit_events();

-- ============================================================
-- 8. RLS HARDENING — migrate `public` role to `authenticated`
-- ============================================================
-- leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- interactions
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;
CREATE POLICY "Users can view their own interactions" ON public.interactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interactions" ON public.interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interactions" ON public.interactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.interactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- client_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.client_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.client_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.client_orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.client_orders;
CREATE POLICY "Users can view their own orders" ON public.client_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.client_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.client_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON public.client_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
