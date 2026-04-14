// Declarative NBA Rule Engine - ACENDER® methodology
import { ActionType, LeadPriority } from '@/types/database';

export interface LeadContext {
  stage: string;
  hoursOverdue: number;
  isOverdue: boolean;
  hoursSinceLastTouch: number;
  hoursSinceCreation: number;
  hasNurtureTrack: boolean;
  hasLastTouch: boolean;
  leadName: string;
}

export interface NBARule {
  id: string;
  stage: string | '*';
  condition: (ctx: LeadContext) => boolean;
  priority: LeadPriority;
  action: ActionType;
  messageTemplate: string;
  assetCode?: string;
  overdueReason: string;
}

// Rules are evaluated in order; first match wins for each category
export const NBA_RULES: NBARule[] = [
  // --- STAGE-SPECIFIC RULES ---
  {
    id: 'atracao-no-contact',
    stage: 'ATRACAO',
    condition: (ctx) => !ctx.hasLastTouch && ctx.hoursSinceCreation > 1,
    priority: 'P1',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Vi que você se interessou pelos nossos produtos profissionais. Posso te mostrar como nossa linha pode transformar seus resultados? 💇‍♀️',
    overdueReason: 'Novo lead aguardando primeiro contato',
  },
  {
    id: 'conexao-stale',
    stage: 'CONEXAO',
    condition: (ctx) => ctx.hoursSinceLastTouch > 24,
    priority: 'P2',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Quero entender melhor sua rotina pra te recomendar exatamente o que vai funcionar pra você. Pode me contar que tipo de cabelo você mais atende? 💁‍♀️',
    overdueReason: 'Aguardando criar conexão',
  },
  {
    id: 'enquadramento-stale',
    stage: 'ENQUADRAMENTO',
    condition: (ctx) => ctx.hoursSinceLastTouch > 24,
    priority: 'P2',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Quero te fazer algumas perguntas rápidas pra personalizar a indicação. Qual a maior dificuldade com os produtos que usa hoje?',
    overdueReason: 'Aguardando qualificação',
  },
  {
    id: 'nutricao-stale',
    stage: 'NUTRICAO',
    condition: (ctx) => ctx.hoursSinceLastTouch > 48,
    priority: 'P2',
    action: 'ENVIAR_MATERIAL',
    messageTemplate: 'Oi {nome}! Preparei um material especial baseado no que conversamos. Dá uma olhada e me fala o que achou! 📄',
    assetCode: 'A1',
    overdueReason: 'Nutrição parada há 48h',
  },
  {
    id: 'demonstracao-stale',
    stage: 'DEMONSTRACAO',
    condition: (ctx) => ctx.hoursSinceLastTouch > 24,
    priority: 'P2',
    action: 'ENVIAR_PROPOSTA',
    messageTemplate: 'Oi {nome}! Montei uma proposta personalizada com o kit ideal pra sua realidade. Posso te mandar os detalhes? 🎯',
    overdueReason: 'Aguardando demonstração/proposta',
  },
  {
    id: 'encerramento-stale',
    stage: 'ENCERRAMENTO',
    condition: (ctx) => ctx.hoursSinceLastTouch > 24,
    priority: 'P1',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Seu pedido já foi processado! Preciso confirmar o endereço de entrega e te enviar o código de rastreio. Pode me chamar? 📦',
    overdueReason: 'Pedido fechado — aguardando dados de entrega',
  },
  {
    id: 'recorrencia-7d',
    stage: 'RECORRENCIA',
    condition: (ctx) => ctx.hoursSinceLastTouch > 168,
    priority: 'P3',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Tudo bem? Já faz um tempinho desde nosso último contato. Pode ser hora de repor o estoque — quer que eu prepare um pedido? 🔄',
    overdueReason: 'Sem contato há 7 dias — oportunidade de recompra',
  },

  // --- CROSS-STAGE RULES ---
  {
    id: 'ghost-24-72h',
    stage: '*',
    condition: (ctx) => ctx.hoursSinceLastTouch > 24 && ctx.hoursSinceLastTouch < 72 && !ctx.hasNurtureTrack,
    priority: 'P3',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Tudo bem? Passou por aqui pra saber como posso te ajudar.',
    overdueReason: 'Lead sem contato há mais de 24h',
  },
  {
    id: 'ghost-72h-plus',
    stage: '*',
    condition: (ctx) => ctx.hoursSinceLastTouch > 72 && !ctx.hasNurtureTrack,
    priority: 'P2',
    action: 'WHATSAPP',
    messageTemplate: 'Oi {nome}! Tudo bem? Passou por aqui pra saber como posso te ajudar.',
    overdueReason: 'Lead sem contato há mais de 3 dias',
  },
];

/**
 * Evaluate rules against a lead context.
 * Returns the first matching stage-specific rule, falling back to cross-stage rules.
 */
export function evaluateRules(ctx: LeadContext): NBARule | null {
  // Stage-specific first
  const stageMatch = NBA_RULES.find(
    r => r.stage === ctx.stage && r.condition(ctx)
  );
  if (stageMatch) return stageMatch;

  // Cross-stage fallback
  const crossMatch = NBA_RULES.find(
    r => r.stage === '*' && r.condition(ctx)
  );
  return crossMatch || null;
}
