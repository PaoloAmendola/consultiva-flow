import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadContext {
  name: string;
  lead_type: string;
  stage: string;
  origin: string;
  priority: string;
  days_since_contact: number;
  interactions_count: number;
  last_interaction_type?: string;
  nurture_track?: string;
  nurture_step?: number;
  next_action_type: string;
  observations?: string;
  available_assets: { code: string; name: string; type: string }[];
}

const SYSTEM_PROMPT = `Você é um Assistente de Vendas especializado em cosméticos profissionais para salões de beleza.
Seu papel é ajudar vendedores a tomar melhores decisões sobre:
1. QUAL AÇÃO tomar com cada lead
2. QUAL MATERIAL enviar (baseado nos assets disponíveis)
3. QUAL SCRIPT usar na abordagem

Contexto do negócio:
- Vendemos produtos capilares profissionais para salões (shampoos, tratamentos, coloração)
- Temos dois tipos de clientes: PROFISSIONAL (cabeleireiros) e DISTRIBUIDOR (revendedores)
- O processo de venda é consultivo: entender necessidades → demonstrar valor → fechar

Etapas do pipeline PROFISSIONAL:
- NOVO_LEAD: Primeiro contato, qualificar interesse
- CONTATO_INICIADO: Entender necessidades do salão
- QUALIFICADO: Lead interessado, mapear produtos que usa
- DIAGNOSTICO: Analisar problemas/oportunidades
- DEMONSTRACAO_PROVA: Enviar amostras ou fazer demonstração
- PROPOSTA_CONDICAO: Apresentar preços e condições
- FECHADO_GANHOU/PERDEU: Resultado da negociação
- ATIVACAO: Cliente novo, garantir primeira compra
- RECORRENCIA: Cliente ativo, expandir portfólio

Etapas do pipeline DISTRIBUIDOR:
- PROSPECT_IDENTIFICADO: Distribuidor potencial identificado
- PRE_QUALIFICACAO: Verificar capacidade e região
- REUNIAO_ESTRATEGICA: Apresentar modelo de parceria
- PROPOSTA_COMERCIAL: Enviar proposta de distribuição
- NEGOCIACAO: Ajustar termos comerciais
- APROVADO: Parceria aprovada
- CADASTRO_CONTRATO: Formalização legal
- ONBOARDING: Treinamento inicial
- ATIVACAO: Primeiro pedido
- EXPANSAO: Crescimento do território

Regras para sugestões:
1. Scripts devem ser diretos, personalizáveis com {nome} e adequados para WhatsApp
2. Materiais sugeridos devem ser APENAS dos assets disponíveis passados no contexto
3. Considere o tempo sem contato para calibrar urgência
4. Se lead está parado há muito tempo, sugira reativação
5. Para distribuidores, foco em números e território

Responda SEMPRE em formato JSON estruturado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_context } = await req.json() as { lead_context: LeadContext };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing sales coach request for user:", claimsData.claims.sub, "lead:", lead_context.name);

    // Load matching playbook (if any) to ground recommendations
    let playbookSection = '';
    try {
      const { data: playbook } = await supabaseClient
        .from('playbooks')
        .select('title, description, objectives, key_questions, scripts, objection_handlers, success_criteria, next_stage_trigger')
        .eq('stage', lead_context.stage)
        .eq('lead_type', lead_context.lead_type)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (playbook) {
        const objectives = (playbook.objectives ?? []).map((o: string) => `  • ${o}`).join('\n');
        const questions = (playbook.key_questions ?? []).map((q: string) => `  • ${q}`).join('\n');
        const scripts = (playbook.scripts ?? []).map((s: any) => `  [${s.label || 'Script'}] ${s.content}`).join('\n');
        const objections = (playbook.objection_handlers ?? []).map((o: any) => `  • "${o.objection}" → ${o.response}`).join('\n');
        const success = (playbook.success_criteria ?? []).map((c: string) => `  • ${c}`).join('\n');

        playbookSection = `\n\nPLAYBOOK OFICIAL DESTA ETAPA (USE COMO BASE PRINCIPAL):
Título: ${playbook.title}
${playbook.description ? `Descrição: ${playbook.description}` : ''}

Objetivos da etapa:
${objectives || '  (não informado)'}

Perguntas-chave a explorar:
${questions || '  (não informado)'}

Scripts oficiais (adapte ao lead, mantendo o tom):
${scripts || '  (não informado)'}

Objeções esperadas e respostas validadas:
${objections || '  (não informado)'}

Critérios de sucesso para avançar:
${success || '  (não informado)'}
${playbook.next_stage_trigger ? `Trigger para próxima etapa: ${playbook.next_stage_trigger}` : ''}

INSTRUÇÃO CRÍTICA: Suas sugestões DEVEM seguir este playbook. Use os scripts como base (personalize com o nome do lead), antecipe as objeções listadas e oriente em direção aos critérios de sucesso.`;
        console.log('Loaded playbook for', lead_context.stage, lead_context.lead_type);
      }
    } catch (e) {
      console.warn('Could not load playbook:', e);
    }

    const userPrompt = `Analise este lead e forneça recomendações:

DADOS DO LEAD:
- Nome: ${lead_context.name}
- Tipo: ${lead_context.lead_type}
- Etapa atual: ${lead_context.stage}
- Origem: ${lead_context.origin}
- Prioridade: ${lead_context.priority}
- Dias sem contato: ${lead_context.days_since_contact}
- Total de interações: ${lead_context.interactions_count}
${lead_context.last_interaction_type ? `- Última interação: ${lead_context.last_interaction_type}` : ''}
${lead_context.nurture_track ? `- Trilha de nutrição: ${lead_context.nurture_track} (passo ${lead_context.nurture_step})` : '- Sem trilha de nutrição'}
- Próxima ação programada: ${lead_context.next_action_type}
${lead_context.observations ? `- Observações: ${lead_context.observations}` : ''}

MATERIAIS DISPONÍVEIS:
${lead_context.available_assets.map(a => `- ${a.code}: ${a.name} (${a.type})`).join('\n')}
${playbookSection}

Responda com um JSON no formato:
{
  "urgency": "alta|media|baixa",
  "summary": "Resumo de 1 linha da situação do lead",
  "recommended_action": {
    "type": "WHATSAPP|LIGACAO|EMAIL|VISITA|REUNIAO|ENVIAR_MATERIAL|DEMONSTRACAO",
    "reason": "Por que essa ação é a melhor agora"
  },
  "script": {
    "opening": "Mensagem de abertura para copiar/colar",
    "key_points": ["ponto 1", "ponto 2", "ponto 3"],
    "closing": "Como encerrar a conversa"
  },
  "recommended_material": {
    "code": "código do asset ou null",
    "name": "nome do asset",
    "reason": "Por que enviar este material agora"
  },
  "strategic_tips": ["dica 1", "dica 2"],
  "objections_to_expect": ["objeção 1", "objeção 2"],
  "next_steps": "O que fazer após esta ação"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao consultar assistente de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let recommendations;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      recommendations = {
        urgency: "media",
        summary: "Análise disponível, mas formato não estruturado",
        raw_response: content,
      };
    }

    console.log("Sales coach recommendations generated successfully");

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sales coach error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
