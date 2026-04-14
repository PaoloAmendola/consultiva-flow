// Stage transition logic - pure functions
import { ActionType, LeadUpdate, ACENDER_STAGES } from '@/types/database';

export interface DefaultNextAction {
  next_action_type: ActionType;
  next_action_at: string;
  next_action_note: string;
}

/**
 * Returns the default next action when a user marks an action as done.
 * Centralizes the "tomorrow at 9am" logic that was hardcoded in Index.tsx.
 */
export function getDefaultNextAction(): DefaultNextAction {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  return {
    next_action_type: 'FOLLOW_UP',
    next_action_at: tomorrow.toISOString(),
    next_action_note: 'Acompanhamento',
  };
}

/**
 * Returns a reschedule update (2 hours from now).
 */
export function getRescheduleUpdate(): Pick<LeadUpdate, 'next_action_at'> {
  const twoHoursFromNow = new Date();
  twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
  return { next_action_at: twoHoursFromNow.toISOString() };
}

/**
 * Get the next stage in the ACENDER pipeline.
 */
export function getNextStage(currentStage: string): string | null {
  const idx = ACENDER_STAGES.findIndex(s => s.value === currentStage);
  if (idx < 0 || idx >= ACENDER_STAGES.length - 1) return null;
  return ACENDER_STAGES[idx + 1].value;
}

/**
 * Returns update data for converting a lead to client (ENCERRAMENTO → RECORRENCIA).
 */
export function getConversionUpdate(): LeadUpdate {
  return {
    stage: 'RECORRENCIA',
    status_final: 'CONVERTIDO',
    substatus: 'D+2',
  };
}

/**
 * Check if advancing from the current stage should trigger conversion.
 */
export function shouldConvertOnAdvance(currentStage: string): boolean {
  return currentStage === 'ENCERRAMENTO';
}
