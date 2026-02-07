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

  // Hours since creation (for new leads with no touch)
  const hoursSinceCreation = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);

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
    // Novo lead sem contato há 1 hora -> primeiro WhatsApp
    if (lead.stage === 'NOVO_LEAD' && !lastTouchDate && hoursSinceCreation > 1) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Tudo bem? Vi que você se interessou pelos nossos produtos. Posso te ajudar a encontrar a solução ideal para o seu espaço?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Novo lead aguardando primeiro contato';
        result.priority = 'P1';
      }
    }

    // Contato iniciado sem qualificação 24h
    if (lead.stage === 'CONTATO_INICIADO' && hoursSinceLastTouch > 24) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Consegui dar uma olhada no que conversamos. Quero entender melhor sua rotina — posso te fazer algumas perguntas rápidas?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Lead não qualificado ainda';
        result.priority = 'P2';
      }
    }

    // Qualificado sem diagnóstico 24h -> script de diagnóstico
    if (lead.stage === 'QUALIFICADO' && hoursSinceLastTouch > 24) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Quero entender melhor o dia a dia do seu trabalho pra recomendar os produtos certos. Posso te ligar rapidinho ou prefere por aqui?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Aguardando diagnóstico';
        result.priority = 'P2';
      }
    }

    // Diagnóstico sem proposta 48h -> enviar prova + A1/A3
    if (lead.stage === 'DIAGNOSTICO' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'ENVIAR_MATERIAL';
      result.suggestedAssetCode = 'A1';
      result.suggestedMessage = `Oi {nome}! Preparei um material especial baseado no que conversamos. Dá uma olhada e me fala o que achou!`;
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

    // Proposta sem resposta 48h -> follow-up + A2
    if (lead.stage === 'PROPOSTA_CONDICAO' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'FOLLOW_UP';
      result.suggestedAssetCode = 'A2';
      result.suggestedMessage = `Oi {nome}! Conseguiu analisar a proposta que enviei? Posso esclarecer qualquer dúvida. Temos uma condição especial essa semana!`;
      if (!result.overdueReason) {
        result.overdueReason = 'Proposta sem resposta há 48h';
        result.priority = 'P1';
      }
    }

    // Ativação -> boas-vindas pós-venda
    if (lead.stage === 'ATIVACAO' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Parabéns pela escolha! 🎉 Como está sendo a experiência com os produtos? Qualquer dúvida sobre uso, estou aqui!`;
      if (!result.overdueReason) {
        result.overdueReason = 'Ativação parada — acompanhar pós-venda';
        result.priority = 'P2';
      }
    }

    // Recorrência -> recompra
    if (lead.stage === 'RECORRENCIA' && hoursSinceLastTouch > 168) { // 7 days
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Tudo bem? Já faz um tempinho desde nosso último contato. Vi que pode ser hora de repor o estoque — quer que eu prepare um pedido?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Sem contato há 7 dias — oportunidade de recompra';
        result.priority = 'P3';
      }
    }
  }

  // DISTRIBUIDOR pipeline rules
  if (lead.lead_type === 'DISTRIBUIDOR') {
    // Prospect sem contato 24h
    if (lead.stage === 'PROSPECT_IDENTIFICADO' && !lastTouchDate && hoursSinceCreation > 1) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Olá {nome}! Somos a [Empresa] e trabalhamos com uma linha profissional de alta performance. Gostaria de apresentar nossa proposta de parceria — podemos agendar uma conversa?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Novo prospect aguardando contato';
        result.priority = 'P1';
      }
    }

    // Reunião estratégica sem avanço 48h
    if (lead.stage === 'REUNIAO_ESTRATEGICA' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'FOLLOW_UP';
      result.suggestedMessage = `Oi {nome}! Foi ótimo conversar sobre a parceria. Estou preparando a proposta comercial — devo ter pronta até amanhã. Alguma dúvida que eu possa adiantar?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Reunião realizada, aguardando proposta';
        result.priority = 'P2';
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

    // Aprovado sem pedido piloto 7 dias
    if (lead.stage === 'APROVADO' && hoursSinceLastTouch > 168) { // 7 days
      result.suggestedAction = 'LIGACAO';
      result.suggestedAssetCode = 'B2';
      if (!result.overdueReason) {
        result.overdueReason = 'Sem pedido piloto há 7 dias';
        result.priority = 'P1';
      }
    }

    // Onboarding parado 48h
    if (lead.stage === 'ONBOARDING' && hoursSinceLastTouch > 48) {
      result.suggestedAction = 'WHATSAPP';
      result.suggestedMessage = `Oi {nome}! Como está o processo de cadastro? Precisa de algum suporte da nossa equipe para agilizar?`;
      if (!result.overdueReason) {
        result.overdueReason = 'Onboarding parado';
        result.priority = 'P2';
      }
    }

    // Ativação distribuidor
    if (lead.stage === 'ATIVACAO' && hoursSinceLastTouch > 72) {
      result.suggestedAction = 'LIGACAO';
      result.suggestedMessage = `Oi {nome}! Quero saber como estão as primeiras vendas. Posso compartilhar dicas de posicionamento e sell-out que funcionam muito bem com outros parceiros.`;
      if (!result.overdueReason) {
        result.overdueReason = 'Parceiro em ativação — acompanhar';
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
