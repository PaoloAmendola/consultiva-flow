// NBA Engine - consumes declarative rules
import { DbLead, DbAsset, LeadPriority, STAGE_GUIDANCE, mapLegacyStage, ActionType } from '@/types/database';
import { evaluateRules, LeadContext } from './nba-rules';

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

export function buildLeadContext(lead: DbLead): LeadContext {
  const now = new Date();
  const nextActionDate = new Date(lead.next_action_at);
  const lastTouchDate = lead.last_touch_at ? new Date(lead.last_touch_at) : null;
  const isOverdue = nextActionDate < now;
  const hoursOverdue = isOverdue ? (now.getTime() - nextActionDate.getTime()) / (1000 * 60 * 60) : 0;
  const hoursSinceLastTouch = lastTouchDate
    ? (now.getTime() - lastTouchDate.getTime()) / (1000 * 60 * 60)
    : Infinity;
  const hoursSinceCreation = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);

  return {
    stage: mapLegacyStage(lead.stage),
    hoursOverdue,
    isOverdue,
    hoursSinceLastTouch,
    hoursSinceCreation,
    hasNurtureTrack: !!lead.nurture_track_id,
    hasLastTouch: !!lastTouchDate,
    leadName: lead.name,
  };
}

export function calculateNBA(lead: DbLead, assets?: DbAsset[]): NBAResult {
  const ctx = buildLeadContext(lead);
  const resolvedStage = ctx.stage;
  const guidance = STAGE_GUIDANCE[resolvedStage];

  const result: NBAResult = {
    priority: lead.priority,
    isOverdue: ctx.isOverdue,
    stageInstruction: guidance?.instruction,
    nextStageName: guidance?.nextStageName || (guidance?.nextStage ? STAGE_GUIDANCE[guidance.nextStage]?.goal : undefined),
  };

  // P1: Overdue action
  if (ctx.isOverdue) {
    result.priority = 'P1';
    if (ctx.hoursOverdue < 1) {
      result.overdueReason = 'Follow-up vencido há alguns minutos';
    } else if (ctx.hoursOverdue < 24) {
      result.overdueReason = `Follow-up vencido há ${Math.floor(ctx.hoursOverdue)}h`;
    } else {
      const daysOverdue = Math.floor(ctx.hoursOverdue / 24);
      result.overdueReason = `Follow-up vencido há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}`;
    }
  }

  // Evaluate declarative rules
  const matchedRule = evaluateRules(ctx);
  if (matchedRule) {
    if (!result.overdueReason) {
      result.overdueReason = matchedRule.overdueReason;
    }
    // Only upgrade priority (lower P# = higher priority)
    const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };
    if (priorityRank[matchedRule.priority] < priorityRank[result.priority]) {
      result.priority = matchedRule.priority;
    }
    result.suggestedAction = matchedRule.action;
    result.suggestedMessage = matchedRule.messageTemplate;
    result.suggestedAssetCode = matchedRule.assetCode;
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
