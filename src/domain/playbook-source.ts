import type { DbLead } from '@/types/database';
import { mapLegacyStage } from '@/types/database';
import type { Playbook } from '@/hooks/usePlaybooks';

export type PlaybookSource = 'custom' | 'default';

/**
 * Determines whether a lead's coach guidance comes from a custom playbook
 * (admin-defined in the `playbooks` table) or from the standard ACENDER fallback.
 */
export function getPlaybookSource(
  lead: Pick<DbLead, 'stage' | 'lead_type'>,
  playbooks: Pick<Playbook, 'stage' | 'lead_type'>[] | undefined,
): PlaybookSource {
  if (!playbooks || playbooks.length === 0) return 'default';
  const stage = mapLegacyStage(lead.stage);
  return playbooks.some(p => p.stage === stage && p.lead_type === lead.lead_type)
    ? 'custom'
    : 'default';
}
