// Next Best Action Engine - ACENDER® methodology
import { DbLead, DbAsset, ActionType, LeadPriority, STAGE_GUIDANCE, mapLegacyStage } from '@/types/database';

export interface NBAResult {
  priority: LeadPriority;
  isOverdue: boolean;
  overdueReason?: string;
  suggestedAction?: ActionType;
  suggestedAssetCode?: string;
  suggestedMessage?: string;
  stageInstruction?: string;
  nextStageName?: string;
}

export function calculateNBA(lead: DbLead, assets?: DbAsset[]): NBAResult {
  const now = new Date();
  const nextActionDate = new Date(lead.next_action_at);
  const lastTouchDate = lead.last_touch_at ? new Date(lead.last_touch_at) : null;
  
  const isOverdue = nextActionDate < now;
  const hoursOverdue = isOverdue ? (now.getTime() - nextActionDate.getTime()) / (1000 * 60 * 60) : 0;
  const hoursSinceLastTouch = lastTouchDate 
    ? (now.getTime() - lastTouchDate.getTime()) / (1000 * 60 * 60) 
    : Infinity;
  const hoursSinceCreation = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);

  // Resolve stage (support legacy stage names)
  const resolvedStage = mapLegacyStage(lead.stage);
  const guidance = STAGE_GUIDANCE[resolvedStage];

  let result: NBAResult = {
    priority: lead.priority,
    isOverdue,
    stageInstruction: guidance?.instruction,
    nextStageName: guidance?.nextStage ? STAGE_GUIDANCE[guidance.nextStage]?.goal : undefined,
  };

  // P1: Overdue action
  if (isOverdue) {
    result.priority = 'P1';
    if (hoursOverdue < 1) {
      result.overdueReason = 'Follow-up vencido há alguns minutos';
    } else if (hoursOverdue < 24) {
      result.overdueReason = `Follow-up vencido há ${Math.floor(hoursOverdue)}h`;
    } else {
      const daysOverdue = Math.floor(hoursOverdue / 24);
      result.overdueReason = `Follow-up vencido há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}`;
    }
  }

  // ACENDER® stage-specific rules
  switch (resolvedStage) {
    case 'ATRACAO':
      if (!lastTouchDate && hoursSinceCreation > 1) {
        result.suggestedAction = 'WHATSAPP';
        result.suggestedMessage = `Oi {nome}! Vi que você se interessou pelos nossos produtos profissionais. Posso te mostrar como nossa linha pode transformar seus resultados? 💇‍♀️`;
        if (!result.overdueReason) {
          result.overdueReason = 'Novo lead aguardando primeiro contato';
          result.priority = 'P1';
        }
      }
      break;

    case 'CONEXAO':
      if (hoursSinceLastTouch > 24) {
        result.suggestedAction = 'WHATSAPP';
        result.suggestedMessage = `Oi {nome}! Quero entender melhor sua rotina pra te recomendar exatamente o que vai funcionar pra você. Pode me contar que tipo de cabelo você mais atende? 💁‍♀️`;
        if (!result.overdueReason) {
          result.overdueReason = 'Aguardando criar conexão';
          result.priority = 'P2';
        }
      }
      break;

    case 'ENQUADRAMENTO':
      if (hoursSinceLastTouch > 24) {
        result.suggestedAction = 'WHATSAPP';
        result.suggestedMessage = `Oi {nome}! Quero te fazer algumas perguntas rápidas pra personalizar a indicação. Qual a maior dificuldade com os produtos que usa hoje?`;
        if (!result.overdueReason) {
          result.overdueReason = 'Aguardando qualificação';
          result.priority = 'P2';
        }
      }
      break;

    case 'NUTRICAO':
      if (hoursSinceLastTouch > 48) {
        result.suggestedAction = 'ENVIAR_MATERIAL';
        result.suggestedAssetCode = 'A1';
        result.suggestedMessage = `Oi {nome}! Preparei um material especial baseado no que conversamos. Dá uma olhada e me fala o que achou! 📄`;
        if (!result.overdueReason) {
          result.overdueReason = 'Nutrição parada há 48h';
          result.priority = 'P2';
        }
      }
      break;

    case 'DEMONSTRACAO':
      if (hoursSinceLastTouch > 24) {
        result.suggestedAction = 'ENVIAR_PROPOSTA';
        result.suggestedMessage = `Oi {nome}! Montei uma proposta personalizada com o kit ideal pra sua realidade. Posso te mandar os detalhes? 🎯`;
        if (!result.overdueReason) {
          result.overdueReason = 'Aguardando demonstração/proposta';
          result.priority = 'P2';
        }
      }
      break;

    case 'ENCERRAMENTO':
      if (hoursSinceLastTouch > 24) {
        result.suggestedAction = 'WHATSAPP';
        result.suggestedMessage = `Oi {nome}! Seu pedido já foi processado! Preciso confirmar o endereço de entrega e te enviar o código de rastreio. Pode me chamar? 📦`;
        if (!result.overdueReason) {
          result.overdueReason = 'Pedido fechado — aguardando dados de entrega';
          result.priority = 'P1';
        }
      }
      break;

    case 'RECORRENCIA':
      if (hoursSinceLastTouch > 168) { // 7 days
        result.suggestedAction = 'WHATSAPP';
        result.suggestedMessage = `Oi {nome}! Tudo bem? Já faz um tempinho desde nosso último contato. Pode ser hora de repor o estoque — quer que eu prepare um pedido? 🔄`;
        if (!result.overdueReason) {
          result.overdueReason = 'Sem contato há 7 dias — oportunidade de recompra';
          result.priority = 'P3';
        }
      }
      break;
  }

  // Lead sumiu 24-72h sem nurture
  if (hoursSinceLastTouch > 24 && hoursSinceLastTouch < 72 && !lead.nurture_track_id) {
    if (!result.suggestedMessage) {
      result.suggestedMessage = `Oi {nome}! Tudo bem? Passou por aqui pra saber como posso te ajudar.`;
    }
  }

  // Lead sumiu mais de 72h
  if (hoursSinceLastTouch > 72 && !lead.nurture_track_id) {
    if (!result.overdueReason) {
      result.overdueReason = 'Lead sem contato há mais de 3 dias';
    }
  }

  // Resolve suggested asset
  if (result.suggestedAssetCode && assets) {
    const asset = assets.find(a => a.code === result.suggestedAssetCode);
    if (asset) {
      result.suggestedMessage = result.suggestedMessage || `Enviar ${asset.name} para reforçar o interesse`;
    }
  }

  return result;
}

export function enrichLeadWithNBA(lead: DbLead, assets?: DbAsset[]): DbLead & NBAResult {
  const nba = calculateNBA(lead, assets);
  return { ...lead, ...nba };
}

export function getPriorityScore(priority: LeadPriority): number {
  switch (priority) {
    case 'P1': return 4;
    case 'P2': return 3;
    case 'P3': return 2;
    case 'P4': return 1;
    default: return 0;
  }
}

export function sortLeadsByActionability(leads: (DbLead & NBAResult)[]): (DbLead & NBAResult)[] {
  return [...leads].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    const priorityDiff = getPriorityScore(a.priority) - getPriorityScore(b.priority);
    if (priorityDiff !== 0) return -priorityDiff;
    return new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime();
  });
}
