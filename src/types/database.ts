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
export const STAGE_GUIDANCE: Record<string, { goal: string; instruction: string; nextStage: string | null }> = {
  ATRACAO: {
    goal: 'Gerar interesse qualificado',
    instruction: 'Envie a primeira mensagem personalizada e pergunte sobre o trabalho do lead',
    nextStage: 'CONEXAO',
  },
  CONEXAO: {
    goal: 'Criar confiança imediata',
    instruction: 'Faça perguntas leves sobre tipo de cabelo e rotina no salão',
    nextStage: 'ENQUADRAMENTO',
  },
  ENQUADRAMENTO: {
    goal: 'Qualificar lead (A/B/C)',
    instruction: 'Aplique as 5 perguntas de qualificação: dor, volume, experiência, tipo de cabelo, prioridade',
    nextStage: 'NUTRICAO',
  },
  NUTRICAO: {
    goal: 'Educar tecnicamente',
    instruction: 'Envie os materiais educativos na sequência: Catálogo → Vídeo → Comparativo → ROI → Antes/Depois',
    nextStage: 'DEMONSTRACAO',
  },
  DEMONSTRACAO: {
    goal: 'Personalizar solução',
    instruction: 'Monte a proposta personalizada com kit adequado, ROI calculado e garantia',
    nextStage: 'ENCERRAMENTO',
  },
  ENCERRAMENTO: {
    goal: 'Fechar venda',
    instruction: 'Aplique o fechamento direto, confirme pedido e colete dados de pagamento',
    nextStage: 'RECORRENCIA',
  },
  RECORRENCIA: {
    goal: 'Pós-venda (D+2 até D+90)',
    instruction: 'Acompanhe resultados, colete depoimentos e ofereça reposição',
    nextStage: null,
  },
};

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
