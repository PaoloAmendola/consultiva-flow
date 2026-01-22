// Next Best Action Engine - Deterministic rules for lead prioritization and suggestions
import { DbLead, DbAsset, ActionType, LeadPriority } from '@/types/database';

export interface NBAResult {
  priority: LeadPriority;
  isOverdue: boolean;
  overdueReason?: string;
  suggestedAction?: ActionType;
  suggestedAssetCode?: string;
  suggestedMessage?: string;
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

  let result: NBAResult = {
    priority: lead.priority,
    isOverdue,
  };

  // P1: Ação vencida
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

  // PROFISSIONAL pipeline rules
  if (lead.lead_type === 'PROFISSIONAL') {
    // Proposta sem resposta 48h -> follow-up + A2
    if (lead.stage === 'PROPOSTA_CONDICAO' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'FOLLOW_UP';
      result.suggestedAssetCode = 'A2';
      if (!result.overdueReason) {
        result.overdueReason = 'Proposta sem resposta há 48h';
        result.priority = 'P1';
      }
    }

    // Diagnóstico sem proposta 48h -> enviar prova + A1/A3
    if (lead.stage === 'DIAGNOSTICO' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'ENVIAR_MATERIAL';
      result.suggestedAssetCode = 'A1';
      if (!result.overdueReason) {
        result.overdueReason = 'Diagnóstico sem proposta há 48h';
        result.priority = 'P2';
      }
    }

    // Demonstração/Prova sem retorno 24h
    if (lead.stage === 'DEMONSTRACAO_PROVA' && hoursSinceLastTouch > 24) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Como foi a experiência com o produto? Conseguiu testar?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Aguardando feedback da demonstração';
        result.priority = 'P2';
      }
    }

    // Contato iniciado sem qualificação 24h
    if (lead.stage === 'CONTATO_INICIADO' && hoursSinceLastTouch > 24) {
      result.suggestedAction = 'WHATSAPP';
      if (!result.overdueReason) {
        result.overdueReason = 'Lead não qualificado ainda';
        result.priority = 'P2';
      }
    }
  }

  // DISTRIBUIDOR pipeline rules
  if (lead.lead_type === 'DISTRIBUIDOR') {
    // Aprovado sem pedido piloto 7 dias
    if (lead.stage === 'APROVADO' && hoursSinceLastTouch > 168) { // 7 days
      result.suggestedAction = 'LIGACAO';
      result.suggestedAssetCode = 'B2';
      if (!result.overdueReason) {
        result.overdueReason = 'Sem pedido piloto há 7 dias';
        result.priority = 'P1';
      }
    }

    // Proposta comercial sem resposta 72h
    if (lead.stage === 'PROPOSTA_COMERCIAL' && hoursSinceLastTouch > 72) {
      result.suggestedAction = 'FOLLOW_UP';
      result.suggestedAssetCode = 'B1';
      if (!result.overdueReason) {
        result.overdueReason = 'Proposta comercial sem resposta há 72h';
        result.priority = 'P1';
      }
    }

    // Reunião estratégica sem avanço 48h
    if (lead.stage === 'REUNIAO_ESTRATEGICA' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'FOLLOW_UP';
      if (!result.overdueReason) {
        result.overdueReason = 'Reunião realizada, aguardando proposta';
        result.priority = 'P2';
      }
    }

    // Onboarding parado 48h
    if (lead.stage === 'ONBOARDING' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'WHATSAPP';
      if (!result.overdueReason) {
        result.overdueReason = 'Onboarding parado';
        result.priority = 'P2';
      }
    }
  }

  // Lead sumiu 24-72h sem estar em nurture -> sugerir reativação
  if (hoursSinceLastTouch > 24 && hoursSinceLastTouch < 72 && !lead.nurture_track_id) {
    if (!result.suggestedMessage) {
      result.suggestedMessage = `Oi {nome}! Tudo bem? Passou por aqui pra saber como posso te ajudar.`;
    }
  }

  // Lead sumiu mais de 72h -> T6 reativação
  if (hoursSinceLastTouch > 72 && !lead.nurture_track_id) {
    if (!result.overdueReason) {
      result.overdueReason = 'Lead sem contato há mais de 3 dias';
    }
  }

  // Resolve suggested asset to full object if available
  if (result.suggestedAssetCode && assets) {
    const asset = assets.find(a => a.code === result.suggestedAssetCode);
    if (asset) {
      result.suggestedMessage = result.suggestedMessage || 
        `Enviar ${asset.name} para reforçar o interesse`;
    }
  }

  return result;
}

// Enrich lead with NBA data for display
export function enrichLeadWithNBA(lead: DbLead, assets?: DbAsset[]): DbLead & NBAResult {
  const nba = calculateNBA(lead, assets);
  return {
    ...lead,
    ...nba,
  };
}

// Calculate priority score for sorting
export function getPriorityScore(priority: LeadPriority): number {
  switch (priority) {
    case 'P1': return 4;
    case 'P2': return 3;
    case 'P3': return 2;
    case 'P4': return 1;
    default: return 0;
  }
}

// Sort leads by actionability
export function sortLeadsByActionability(leads: (DbLead & NBAResult)[]): (DbLead & NBAResult)[] {
  return [...leads].sort((a, b) => {
    // First: overdue leads
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    
    // Second: by priority
    const priorityDiff = getPriorityScore(a.priority) - getPriorityScore(b.priority);
    if (priorityDiff !== 0) return -priorityDiff;
    
    // Third: by next action date (soonest first)
    return new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime();
  });
}
