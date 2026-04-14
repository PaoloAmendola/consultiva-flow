// Lead operational scoring - pure functions
import { ACENDER_STAGES } from '@/types/database';
import { LeadContext } from './nba-rules';

export interface LeadScore {
  total: number;       // 0-100
  urgency: number;     // 0-100
  potential: number;   // 0-100
  delay: number;       // 0-100
}

/**
 * Calculate an operational score for a lead.
 * Higher = needs more attention.
 */
export function calculateLeadScore(ctx: LeadContext): LeadScore {
  // Urgency: how overdue (capped at 72h = 100)
  const urgency = ctx.isOverdue
    ? Math.min(100, Math.round((ctx.hoursOverdue / 72) * 100))
    : 0;

  // Potential: how close to closing (later stage = higher)
  const stageIdx = ACENDER_STAGES.findIndex(s => s.value === ctx.stage);
  const maxIdx = ACENDER_STAGES.length - 1;
  const potential = maxIdx > 0 ? Math.round((stageIdx / maxIdx) * 100) : 0;

  // Delay: hours without touch (capped at 168h/7d = 100)
  const delay = ctx.hoursSinceLastTouch === Infinity
    ? 100
    : Math.min(100, Math.round((ctx.hoursSinceLastTouch / 168) * 100));

  // Weighted composite
  const total = Math.round(urgency * 0.45 + potential * 0.25 + delay * 0.30);

  return { total, urgency, potential, delay };
}
