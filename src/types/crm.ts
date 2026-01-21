// Lead Types
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

export type ProfissionalStage = 
  | 'NOVO_LEAD'
  | 'CONTATO_INICIADO'
  | 'QUALIFICADO'
  | 'DIAGNOSTICO'
  | 'DEMONSTRACAO_PROVA'
  | 'PROPOSTA_CONDICAO'
  | 'FECHADO_GANHOU'
  | 'FECHADO_PERDEU'
  | 'ATIVACAO'
  | 'RECORRENCIA';

export type DistribuidorStage = 
  | 'PROSPECT_IDENTIFICADO'
  | 'PRE_QUALIFICACAO'
  | 'REUNIAO_ESTRATEGICA'
  | 'PROPOSTA_COMERCIAL'
  | 'NEGOCIACAO'
  | 'APROVADO'
  | 'CADASTRO_CONTRATO'
  | 'ONBOARDING'
  | 'ATIVACAO'
  | 'EXPANSAO'
  | 'FECHADO_PERDEU';

export type LeadStage = ProfissionalStage | DistribuidorStage;

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

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

export type StatusFinal = 
  | 'ATIVO'
  | 'CONVERTIDO'
  | 'PERDIDO'
  | 'FORA_PERFIL';

export interface Lead {
  id: string;
  notionPageId?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  leadType: LeadType;
  origin: LeadOrigin;
  stage: LeadStage;
  substatus?: string;
  priority: Priority;
  score?: number;
  tags?: string[];
  
  // Next action (required)
  nextActionType: ActionType;
  nextActionAt: string; // ISO date
  nextActionNote?: string;
  
  // Nurture
  nurtureTrackId?: string;
  nurtureStep?: number; // 0=D0, 1=D1, 2=D3, etc
  
  // Timestamps
  createdAt: string;
  lastTouchAt?: string;
  statusFinal: StatusFinal;
  
  // Computed
  isOverdue?: boolean;
  overdueReason?: string;
  suggestedMessage?: string;
  suggestedAsset?: Asset;
}

export interface Interaction {
  id: string;
  leadId: string;
  type: InteractionType;
  direction: InteractionDirection;
  content?: string;
  assetSent?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  actionType: ActionType;
  dueAt: string;
  status: 'OPEN' | 'DONE' | 'CANCELED';
  note?: string;
  createdAt: string;
}

export interface NurtureTrack {
  id: string;
  name: string;
  description?: string;
  leadType: LeadType;
  steps: NurtureStep[];
}

export interface NurtureStep {
  day: number; // D0, D1, D3, D5, D7
  message: string;
  assetId?: string;
  actionType: ActionType;
}

export interface Asset {
  id: string;
  name: string;
  type: 'PDF' | 'VIDEO' | 'IMAGEM' | 'LINK' | 'AUDIO';
  url: string;
  description?: string;
  tags?: string[];
  forLeadType?: LeadType[];
}

// Pipeline config
export const PROFISSIONAL_STAGES: { value: ProfissionalStage; label: string; color: string }[] = [
  { value: 'NOVO_LEAD', label: 'Novo Lead', color: 'pipeline-new' },
  { value: 'CONTATO_INICIADO', label: 'Contato Iniciado', color: 'pipeline-contact' },
  { value: 'QUALIFICADO', label: 'Qualificado', color: 'pipeline-qualified' },
  { value: 'DIAGNOSTICO', label: 'Diagnóstico', color: 'pipeline-demo' },
  { value: 'DEMONSTRACAO_PROVA', label: 'Demonstração/Prova', color: 'pipeline-demo' },
  { value: 'PROPOSTA_CONDICAO', label: 'Proposta/Condição', color: 'pipeline-proposal' },
  { value: 'FECHADO_GANHOU', label: 'Fechado - Ganhou', color: 'pipeline-won' },
  { value: 'FECHADO_PERDEU', label: 'Fechado - Perdeu', color: 'pipeline-lost' },
  { value: 'ATIVACAO', label: 'Ativação', color: 'pipeline-qualified' },
  { value: 'RECORRENCIA', label: 'Recorrência', color: 'pipeline-won' },
];

export const DISTRIBUIDOR_STAGES: { value: DistribuidorStage; label: string; color: string }[] = [
  { value: 'PROSPECT_IDENTIFICADO', label: 'Prospect Identificado', color: 'pipeline-new' },
  { value: 'PRE_QUALIFICACAO', label: 'Pré-Qualificação', color: 'pipeline-contact' },
  { value: 'REUNIAO_ESTRATEGICA', label: 'Reunião Estratégica', color: 'pipeline-qualified' },
  { value: 'PROPOSTA_COMERCIAL', label: 'Proposta Comercial', color: 'pipeline-proposal' },
  { value: 'NEGOCIACAO', label: 'Negociação', color: 'pipeline-proposal' },
  { value: 'APROVADO', label: 'Aprovado', color: 'pipeline-qualified' },
  { value: 'CADASTRO_CONTRATO', label: 'Cadastro/Contrato', color: 'pipeline-demo' },
  { value: 'ONBOARDING', label: 'Onboarding', color: 'pipeline-demo' },
  { value: 'ATIVACAO', label: 'Ativação', color: 'pipeline-qualified' },
  { value: 'EXPANSAO', label: 'Expansão', color: 'pipeline-won' },
  { value: 'FECHADO_PERDEU', label: 'Fechado - Perdeu', color: 'pipeline-lost' },
];

export const ACTION_TYPES: { value: ActionType; label: string; icon: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'LIGACAO', label: 'Ligação', icon: 'Phone' },
  { value: 'EMAIL', label: 'Email', icon: 'Mail' },
  { value: 'VISITA', label: 'Visita', icon: 'MapPin' },
  { value: 'REUNIAO', label: 'Reunião', icon: 'Calendar' },
  { value: 'ENVIAR_MATERIAL', label: 'Enviar Material', icon: 'FileText' },
  { value: 'ENVIAR_PROPOSTA', label: 'Enviar Proposta', icon: 'FileCheck' },
  { value: 'FOLLOW_UP', label: 'Follow-up', icon: 'RefreshCw' },
  { value: 'DEMONSTRACAO', label: 'Demonstração', icon: 'Play' },
];

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
