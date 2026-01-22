// Database types that map to our Supabase tables
// These are the actual types used in the application, derived from the database schema

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

// Insert types (for creating new records)
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

// Update types (for updating existing records)
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

// Pipeline configurations
export const PROFISSIONAL_STAGES = [
  { value: 'NOVO_LEAD', label: 'Novo Lead', color: 'bg-blue-500' },
  { value: 'CONTATO_INICIADO', label: 'Contato Iniciado', color: 'bg-cyan-500' },
  { value: 'QUALIFICADO', label: 'Qualificado', color: 'bg-teal-500' },
  { value: 'DIAGNOSTICO', label: 'Diagnóstico', color: 'bg-emerald-500' },
  { value: 'DEMONSTRACAO_PROVA', label: 'Demonstração/Prova', color: 'bg-green-500' },
  { value: 'PROPOSTA_CONDICAO', label: 'Proposta/Condição', color: 'bg-yellow-500' },
  { value: 'FECHADO_GANHOU', label: 'Fechado - Ganhou', color: 'bg-green-600' },
  { value: 'FECHADO_PERDEU', label: 'Fechado - Perdeu', color: 'bg-red-500' },
  { value: 'ATIVACAO', label: 'Ativação', color: 'bg-purple-500' },
  { value: 'RECORRENCIA', label: 'Recorrência', color: 'bg-indigo-500' },
] as const;

export const DISTRIBUIDOR_STAGES = [
  { value: 'PROSPECT_IDENTIFICADO', label: 'Prospect Identificado', color: 'bg-blue-500' },
  { value: 'PRE_QUALIFICACAO', label: 'Pré-Qualificação', color: 'bg-cyan-500' },
  { value: 'REUNIAO_ESTRATEGICA', label: 'Reunião Estratégica', color: 'bg-teal-500' },
  { value: 'PROPOSTA_COMERCIAL', label: 'Proposta Comercial', color: 'bg-yellow-500' },
  { value: 'NEGOCIACAO', label: 'Negociação', color: 'bg-orange-500' },
  { value: 'APROVADO', label: 'Aprovado', color: 'bg-green-500' },
  { value: 'CADASTRO_CONTRATO', label: 'Cadastro/Contrato', color: 'bg-emerald-500' },
  { value: 'ONBOARDING', label: 'Onboarding', color: 'bg-teal-600' },
  { value: 'ATIVACAO', label: 'Ativação', color: 'bg-purple-500' },
  { value: 'EXPANSAO', label: 'Expansão', color: 'bg-indigo-500' },
  { value: 'FECHADO_PERDEU', label: 'Fechado - Perdeu', color: 'bg-red-500' },
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

// Helper to get stage config based on lead type
export function getStagesForLeadType(leadType: LeadType) {
  if (leadType === 'DISTRIBUIDOR') {
    return DISTRIBUIDOR_STAGES;
  }
  return PROFISSIONAL_STAGES;
}

export function getStageLabel(stage: string, leadType: LeadType): string {
  const stages = getStagesForLeadType(leadType);
  const found = stages.find(s => s.value === stage);
  return found?.label ?? stage;
}

export function getStageColor(stage: string, leadType: LeadType): string {
  const stages = getStagesForLeadType(leadType);
  const found = stages.find(s => s.value === stage);
  return found?.color ?? 'bg-gray-500';
}
