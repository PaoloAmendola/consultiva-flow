import { useMemo } from 'react';
import { EnrichedLead } from './useLeads';
import {
  ACENDER_STAGES,
  STAGE_GUIDANCE,
  mapLegacyStage,
  type AcenderStage,
} from '@/types/database';
import { buildLeadContext } from '@/domain/nba-engine';
import { calculateLeadScore, type LeadScore } from '@/domain/lead-scoring';

export interface LeadEnrichment {
  resolvedStage: AcenderStage;
  currentStage: typeof ACENDER_STAGES[number] | undefined;
  guidance: typeof STAGE_GUIDANCE[AcenderStage] | undefined;
  nextStageLabel?: string;
  score: LeadScore;
  isP1: boolean;
}

/**
 * Centralizes derived/computed values for a lead so that LeadCard
 * (and other presentational components) stay free of domain imports.
 */
export function useLeadEnrichment(lead: EnrichedLead): LeadEnrichment {
  return useMemo(() => {
    const resolvedStage = mapLegacyStage(lead.stage);
    const currentStage = ACENDER_STAGES.find(s => s.value === resolvedStage);
    const guidance = STAGE_GUIDANCE[resolvedStage];
    const score = calculateLeadScore(buildLeadContext(lead));
    const nextStageLabel = guidance?.nextStage
      ? ACENDER_STAGES.find(s => s.value === guidance.nextStage)?.label
      : undefined;

    return {
      resolvedStage,
      currentStage,
      guidance,
      nextStageLabel,
      score,
      isP1: lead.priority === 'P1',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, lead.stage, lead.priority, lead.updated_at, lead.next_action_at, lead.last_touch_at]);
}
