// Database types that map to our Supabase tables

export type LeadType = 'PROFISSIONAL' | 'DISTRIBUIDOR' | 'NAO_QUALIFICADO';

export type LeadOrigin = 
  | 'NUVEMSHOP' 
  | 'INSTAGRAM' 
  | 'GOOGLE' 
  | 'WHATSAPP' 
  | 'TELEFONE' 
  | 'INDICACAO' 
  | 'PRESENCIAL_EMPRESA' 
  | 'VISITA_SALAO';

export type LeadPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type LeadStatusFinal = 'ATIVO' | 'CONVERTIDO' | 'PERDIDO' | 'FORA_PERFIL';

export type ActionType = 
  | 'WHATSAPP'
  | 'LIGACAO'
  | 'EMAIL'
  | 'VISITA'
  | 'REUNIAO'
  | 'ENVIAR_MATERIAL'
  | 'ENVIAR_PROPOSTA'
  | 'FOLLOW_UP'
  | 'DEMONSTRACAO';

export type InteractionType = 
  | 'WHATSAPP_IN'
  | 'WHATSAPP_OUT'
  | 'LIGACAO_IN'
  | 'LIGACAO_OUT'
  | 'EMAIL_IN'
  | 'EMAIL_OUT'
  | 'VISITA'
  | 'REUNIAO'
  | 'MUDANCA_ETAPA'
  | 'NOTA';

export type InteractionDirection = 'IN' | 'OUT';

export type TaskStatus = 'OPEN' | 'DONE' | 'CANCELED';

// ACENDER® stage type
export type AcenderStage = 
  | 'ATRACAO'
  | 'CONEXAO'
  | 'ENQUADRAMENTO'
  | 'NUTRICAO'
  | 'DEMONSTRACAO'
  | 'ENCERRAMENTO'
  | 'RECORRENCIA';

// Database row types
export interface DbLead {
  id: string;
  user_id: string;
  notion_page_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  lead_type: LeadType;
  origin: LeadOrigin;
  stage: string;
  substatus: string | null;
  priority: LeadPriority;
  score: number | null;
  tags: string[] | null;
  nurture_track_id: string | null;
  nurture_step: number | null;
  next_action_type: ActionType;
  next_action_at: string;
  next_action_note: string | null;
  last_touch_at: string | null;
  status_final: LeadStatusFinal;
  observations: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInteraction {
  id: string;
  user_id: string;
  lead_id: string;
  notion_page_id: string | null;
  type: InteractionType;
  direction: InteractionDirection;
  content: string | null;
  asset_sent: string | null;
  created_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  lead_id: string;
  notion_page_id: string | null;
  title: string;
  action_type: ActionType;
  due_at: string;
  status: TaskStatus;
  priority: LeadPriority;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbNurtureTrack {
  id: string;
  notion_page_id: string | null;
  name: string;
  description: string | null;
  lead_type: LeadType;
  steps: NurtureStep[];
  created_at: string;
  updated_at: string;
}

export interface NurtureStep {
  day: number;
  message: string;
  asset_id?: string;
  action_type: ActionType;
}

export interface DbAsset {
  id: string;
  notion_page_id: string | null;
  code: string;
  name: string;
  type: string;
  url: string;
  description: string | null;
  for_lead_type: LeadType[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Insert types
export interface LeadInsert {
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  lead_type: LeadType;
  origin: LeadOrigin;
  stage?: string;
  substatus?: string | null;
  priority?: LeadPriority;
  score?: number | null;
  tags?: string[] | null;
  nurture_track_id?: string | null;
  nurture_step?: number | null;
  next_action_type: ActionType;
  next_action_at: string;
  next_action_note?: string | null;
  observations?: string | null;
}

export interface InteractionInsert {
  lead_id: string;
  type: InteractionType;
  direction: InteractionDirection;
  content?: string | null;
  asset_sent?: string | null;
}

export interface TaskInsert {
  lead_id: string;
  title: string;
  action_type: ActionType;
  due_at: string;
  priority?: LeadPriority;
  note?: string | null;
}

export interface LeadUpdate {
  name?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  lead_type?: LeadType;
  origin?: LeadOrigin;
  stage?: string;
  substatus?: string | null;
  priority?: LeadPriority;
  score?: number | null;
  tags?: string[] | null;
  nurture_track_id?: string | null;
  nurture_step?: number | null;
  next_action_type?: ActionType;
  next_action_at?: string;
  next_action_note?: string | null;
  status_final?: LeadStatusFinal;
  observations?: string | null;
}

export interface TaskUpdate {
  title?: string;
  action_type?: ActionType;
  due_at?: string;
  status?: TaskStatus;
  priority?: LeadPriority;
  note?: string | null;
}

// ACENDER® Pipeline - unified for all lead types
export const ACENDER_STAGES = [
  { value: 'ATRACAO' as const, label: 'Atração', letter: 'A', color: 'bg-red-500', textColor: 'text-red-500', cssVar: '--stage-atracao' },
  { value: 'CONEXAO' as const, label: 'Conexão', letter: 'C', color: 'bg-yellow-500', textColor: 'text-yellow-500', cssVar: '--stage-conexao' },
  { value: 'ENQUADRAMENTO' as const, label: 'Enquadramento', letter: 'E', color: 'bg-emerald-500', textColor: 'text-emerald-500', cssVar: '--stage-enquadramento' },
  { value: 'NUTRICAO' as const, label: 'Nutrição', letter: 'N', color: 'bg-blue-500', textColor: 'text-blue-500', cssVar: '--stage-nutricao' },
  { value: 'DEMONSTRACAO' as const, label: 'Demonstração', letter: 'D', color: 'bg-purple-500', textColor: 'text-purple-500', cssVar: '--stage-demonstracao' },
  { value: 'ENCERRAMENTO' as const, label: 'Encerramento', letter: 'E', color: 'bg-orange-500', textColor: 'text-orange-500', cssVar: '--stage-encerramento' },
  { value: 'RECORRENCIA' as const, label: 'Recorrência', letter: 'R', color: 'bg-zinc-700', textColor: 'text-zinc-400', cssVar: '--stage-recorrencia' },
] as const;

// Keep backward compat aliases
export const PROFISSIONAL_STAGES = ACENDER_STAGES;
export const DISTRIBUIDOR_STAGES = ACENDER_STAGES;

// Stage guidance: what to do at each stage
export interface StageGuidanceItem {
  goal: string;
  instruction: string;
  nextStage: string | null;
  nextStageName: string;
  whatToSend: string[];
  objections: string[];
  scripts: string[];
  nextStepAction: string;
}

export const STAGE_GUIDANCE: Record<string, StageGuidanceItem> = {
  ATRACAO: {
    goal: 'Gerar interesse qualificado',
    instruction: 'Envie a primeira mensagem personalizada em até 1h. Pergunte sobre o trabalho e demonstre que conhece o segmento.',
    nextStage: 'CONEXAO',
    nextStageName: 'Conexão',
    whatToSend: ['Catálogo digital de produtos', 'Vídeo institucional curto (30s)'],
    objections: ['"Não tenho interesse"', '"Já uso outra marca"', '"Me manda por email"'],
    scripts: [
      'Oi {nome}! Vi que você se interessou pelos nossos produtos profissionais. Posso te mostrar como nossa linha pode transformar seus resultados? 💇‍♀️',
      'Oi {nome}! Sou da [empresa], trabalho com produtos profissionais pra salão. Posso te mandar um catálogo rápido?',
    ],
    nextStepAction: 'Obter resposta do lead e avançar para Conexão',
  },
  CONEXAO: {
    goal: 'Criar confiança e rapport',
    instruction: 'Faça perguntas leves sobre o dia a dia do salão. Descubra tipos de cabelo que mais atende, volume de clientes e marca atual.',
    nextStage: 'ENQUADRAMENTO',
    nextStageName: 'Enquadramento',
    whatToSend: ['Depoimentos de outros profissionais', 'Cases de sucesso rápidos'],
    objections: ['"Não tenho tempo agora"', '"Pode falar mais tarde?"', '"Estou satisfeito com meu fornecedor"'],
    scripts: [
      'Oi {nome}! Quero entender melhor sua rotina pra te recomendar exatamente o que vai funcionar pra você. Que tipo de cabelo você mais atende? 💁‍♀️',
      '{nome}, conta pra mim: qual o maior desafio que você enfrenta hoje no salão com os produtos que usa?',
    ],
    nextStepAction: 'Coletar informações básicas e avançar para Enquadramento',
  },
  ENQUADRAMENTO: {
    goal: 'Qualificar o lead (A/B/C)',
    instruction: 'Aplique as 5 perguntas de qualificação: 1) Qual a dor principal? 2) Volume mensal de clientes? 3) Experiência com a categoria? 4) Tipo de cabelo predominante? 5) O que é prioridade agora?',
    nextStage: 'NUTRICAO',
    nextStageName: 'Nutrição',
    whatToSend: ['Formulário de diagnóstico', 'Checklist de necessidades'],
    objections: ['"São muitas perguntas"', '"Só quero saber o preço"', '"Não sei se vale a pena mudar"'],
    scripts: [
      'Oi {nome}! Quero te fazer algumas perguntas rápidas pra personalizar a indicação. Qual a maior dificuldade com os produtos que usa hoje?',
      '{nome}, pra montar a melhor recomendação, preciso saber: quantos clientes você atende por semana em média?',
    ],
    nextStepAction: 'Classificar perfil do lead e iniciar nutrição com materiais educativos',
  },
  NUTRICAO: {
    goal: 'Educar tecnicamente e gerar desejo',
    instruction: 'Envie materiais educativos na sequência: Catálogo → Vídeo técnico → Comparativo → ROI → Antes/Depois. Espaçar envios a cada 2-3 dias.',
    nextStage: 'DEMONSTRACAO',
    nextStageName: 'Demonstração',
    whatToSend: ['Catálogo completo da linha', 'Vídeo de aplicação', 'Comparativo técnico', 'Calculadora de ROI', 'Fotos antes/depois'],
    objections: ['"Vou pensar"', '"Preciso conversar com meu sócio"', '"Esse produto funciona mesmo?"'],
    scripts: [
      'Oi {nome}! Preparei um material especial baseado no que conversamos. Dá uma olhada e me fala o que achou! 📄',
      '{nome}, olha esse resultado real de uma profissional que começou a usar nossa linha mês passado 👀',
    ],
    nextStepAction: 'Confirmar interesse e agendar demonstração ou enviar proposta',
  },
  DEMONSTRACAO: {
    goal: 'Personalizar a solução e apresentar proposta',
    instruction: 'Monte a proposta personalizada com: kit adequado ao perfil, cálculo de ROI, condições de pagamento e garantia. Apresente benefícios específicos para o perfil do lead.',
    nextStage: 'ENCERRAMENTO',
    nextStageName: 'Encerramento',
    whatToSend: ['Proposta comercial personalizada', 'Tabela de preços', 'Condições especiais', 'Vídeo demonstrativo do produto'],
    objections: ['"Tá caro"', '"Preciso de desconto"', '"Vou comparar com outros fornecedores"', '"Não tenho verba agora"'],
    scripts: [
      'Oi {nome}! Montei uma proposta personalizada com o kit ideal pra sua realidade. Posso te mandar os detalhes? 🎯',
      '{nome}, com base no que conversamos, separei um kit que vai resolver [dor específica]. Quer ver os detalhes e valores?',
    ],
    nextStepAction: 'Confirmar pedido e coletar dados para faturamento',
  },
  ENCERRAMENTO: {
    goal: 'Finalizar pedido e garantir entrega',
    instruction: 'O cliente já fechou o pedido! Agora colete: dados de entrega (endereço completo), confirme forma de pagamento, envie código de rastreio quando disponível e alinhe prazo de entrega.',
    nextStage: 'RECORRENCIA',
    nextStageName: 'Recorrência (Cliente)',
    whatToSend: ['Confirmação do pedido', 'Código de rastreio', 'Guia de primeiros passos', 'Manual de uso dos produtos'],
    objections: ['"Quando chega?"', '"Posso alterar o endereço?"', '"Quero adicionar mais um item"', '"O frete tá caro"'],
    scripts: [
      'Oi {nome}! Pedido confirmado! 🎉 Preciso do endereço completo pra envio. Pode me passar?',
      '{nome}, seu pedido já foi despachado! Aqui está o código de rastreio: [código]. Qualquer dúvida, me chama! 📦',
      '{nome}, seu pedido chega em [X dias]. Enquanto isso, preparei um guia rápido de como usar os produtos pra ter o melhor resultado! 📋',
    ],
    nextStepAction: 'Confirmar entrega e iniciar acompanhamento pós-venda (D+2)',
  },
  RECORRENCIA: {
    goal: 'Pós-venda e fidelização (D+2 até D+90)',
    instruction: 'Acompanhe resultados, colete depoimentos e ofereça reposição. Siga a timeline: D+2 Suporte → D+7 Resultado → D+15 Satisfação → D+30 Reposição → D+60 Depoimento → D+90 Cross-sell.',
    nextStage: null,
    nextStageName: '',
    whatToSend: ['Dicas de uso avançado', 'Convite para grupo exclusivo', 'Ofertas de reposição', 'Novos lançamentos'],
    objections: ['"Ainda não usei tudo"', '"Não preciso repor agora"', '"Quero experimentar outra marca"'],
    scripts: [
      'Oi {nome}! Tudo bem? Já faz um tempinho desde nosso último contato. Pode ser hora de repor o estoque — quer que eu prepare um pedido? 🔄',
      '{nome}, como estão os resultados com os produtos? Quero saber se posso te ajudar com alguma dúvida! 💬',
    ],
    nextStepAction: 'Manter relacionamento ativo e estimular recompra',
  },
};

// ACENDER stages excluding RECORRENCIA (for Leads Kanban)
export const ACENDER_SALES_STAGES = ACENDER_STAGES.filter(s => s.value !== 'RECORRENCIA');

// Post-sale substages for Clientes module
export const RECORRENCIA_SUBSTAGES = [
  { value: 'D+2', label: 'Suporte', description: 'Confirmar recebimento e tirar dúvidas', day: 2 },
  { value: 'D+7', label: 'Resultado', description: 'Verificar primeiros resultados', day: 7 },
  { value: 'D+15', label: 'Satisfação', description: 'Avaliar satisfação e coletar feedback', day: 15 },
  { value: 'D+30', label: 'Reposição', description: 'Oferecer reposição de produtos', day: 30 },
  { value: 'D+45', label: 'Comunidade', description: 'Convidar para grupo exclusivo', day: 45 },
  { value: 'D+60', label: 'Depoimento', description: 'Solicitar depoimento e avaliação', day: 60 },
  { value: 'D+90', label: 'Cross-sell', description: 'Apresentar novos produtos e upgrades', day: 90 },
] as const;

export const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; icon: string }> = {
  WHATSAPP: { label: 'WhatsApp', icon: 'MessageCircle' },
  LIGACAO: { label: 'Ligação', icon: 'Phone' },
  EMAIL: { label: 'Email', icon: 'Mail' },
  VISITA: { label: 'Visita', icon: 'MapPin' },
  REUNIAO: { label: 'Reunião', icon: 'Calendar' },
  ENVIAR_MATERIAL: { label: 'Enviar Material', icon: 'FileText' },
  ENVIAR_PROPOSTA: { label: 'Enviar Proposta', icon: 'FileCheck' },
  FOLLOW_UP: { label: 'Follow-up', icon: 'RefreshCw' },
  DEMONSTRACAO: { label: 'Demonstração', icon: 'Play' },
};

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  NUVEMSHOP: 'Nuvemshop',
  INSTAGRAM: 'Instagram',
  GOOGLE: 'Google',
  WHATSAPP: 'WhatsApp',
  TELEFONE: 'Telefone',
  INDICACAO: 'Indicação',
  PRESENCIAL_EMPRESA: 'Presencial',
  VISITA_SALAO: 'Visita em Salão',
};

export const PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string }> = {
  P1: { label: 'P1 - Urgente', color: 'bg-red-500 text-white' },
  P2: { label: 'P2 - Alta', color: 'bg-orange-500 text-white' },
  P3: { label: 'P3 - Normal', color: 'bg-yellow-500 text-black' },
  P4: { label: 'P4 - Baixa', color: 'bg-gray-400 text-white' },
};

// Helper to get stage config - now always returns ACENDER stages
export function getStagesForLeadType(_leadType?: LeadType) {
  return ACENDER_STAGES;
}

export function getStageLabel(stage: string, _leadType?: LeadType): string {
  const found = ACENDER_STAGES.find(s => s.value === stage);
  return found?.label ?? stage;
}

export function getStageColor(stage: string, _leadType?: LeadType): string {
  const found = ACENDER_STAGES.find(s => s.value === stage);
  return found?.color ?? 'bg-gray-500';
}

export function getStageByValue(stage: string) {
  return ACENDER_STAGES.find(s => s.value === stage);
}

// Map old stage names to ACENDER for migration
export function mapLegacyStage(stage: string): string {
  const legacyMap: Record<string, string> = {
    'NOVO_LEAD': 'ATRACAO',
    'CONTATO_INICIADO': 'CONEXAO',
    'QUALIFICADO': 'ENQUADRAMENTO',
    'DIAGNOSTICO': 'ENQUADRAMENTO',
    'DEMONSTRACAO_PROVA': 'DEMONSTRACAO',
    'PROPOSTA_CONDICAO': 'ENCERRAMENTO',
    'FECHADO_GANHOU': 'RECORRENCIA',
    'ATIVACAO': 'RECORRENCIA',
    'RECORRENCIA': 'RECORRENCIA',
    'PROSPECT_IDENTIFICADO': 'ATRACAO',
    'PRE_QUALIFICACAO': 'CONEXAO',
    'REUNIAO_ESTRATEGICA': 'ENQUADRAMENTO',
    'PROPOSTA_COMERCIAL': 'DEMONSTRACAO',
    'NEGOCIACAO': 'ENCERRAMENTO',
    'APROVADO': 'ENCERRAMENTO',
    'CADASTRO_CONTRATO': 'ENCERRAMENTO',
    'ONBOARDING': 'RECORRENCIA',
    'EXPANSAO': 'RECORRENCIA',
  };
  return legacyMap[stage] || stage;
}
