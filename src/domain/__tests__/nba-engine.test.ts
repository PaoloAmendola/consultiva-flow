import { describe, it, expect } from 'vitest';
import { calculateNBA, enrichLeadWithNBA, sortLeadsByActionability } from '../nba-engine';
import { DbLead } from '@/types/database';

function makeLead(overrides: Partial<DbLead> = {}): DbLead {
  const now = new Date();
  return {
    id: '1',
    user_id: 'u1',
    notion_page_id: null,
    name: 'Maria',
    phone: '11999999999',
    email: null,
    company: null,
    city: null,
    state: null,
    lead_type: 'PROFISSIONAL',
    origin: 'INSTAGRAM',
    stage: 'ATRACAO',
    substatus: null,
    priority: 'P3',
    score: null,
    tags: null,
    nurture_track_id: null,
    nurture_step: null,
    next_action_type: 'WHATSAPP',
    next_action_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    next_action_note: null,
    last_touch_at: null,
    status_final: 'ATIVO',
    observations: null,
    synced_at: null,
    created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  } as DbLead;
}

describe('NBA Engine', () => {
  it('marks overdue lead as P1', () => {
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const lead = makeLead({
      next_action_at: pastDate,
      last_touch_at: new Date().toISOString(),
    });
    console.log('lead.next_action_at:', lead.next_action_at);
    console.log('pastDate:', pastDate);
    console.log('now:', new Date().toISOString());
    console.log('nextActionDate < now:', new Date(lead.next_action_at) < new Date());
    const result = calculateNBA(lead);
    console.log('result:', JSON.stringify(result, null, 2));
    expect(result.isOverdue).toBe(true);
    expect(result.priority).toBe('P1');
    expect(result.overdueReason).toContain('vencido');
  });

  it('new lead without contact gets P1 via rule', () => {
    const lead = makeLead({ last_touch_at: null });
    const result = calculateNBA(lead);
    expect(result.priority).toBe('P1');
    expect(result.suggestedAction).toBe('WHATSAPP');
  });

  it('enrichLeadWithNBA merges correctly', () => {
    const lead = makeLead();
    const enriched = enrichLeadWithNBA(lead);
    expect(enriched.id).toBe('1');
    expect(enriched).toHaveProperty('isOverdue');
    expect(enriched).toHaveProperty('priority');
  });

  it('sortLeadsByActionability puts overdue first', () => {
    const overdueLead = makeLead({
      id: 'overdue',
      next_action_at: new Date(Date.now() - 60000).toISOString(),
      last_touch_at: new Date().toISOString(),
    });
    const upcomingLead = makeLead({
      id: 'upcoming',
      next_action_at: new Date(Date.now() + 3600000).toISOString(),
      last_touch_at: new Date().toISOString(),
    });
    const overdue = enrichLeadWithNBA(overdueLead);
    const upcoming = enrichLeadWithNBA(upcomingLead);
    const sorted = sortLeadsByActionability([upcoming, overdue]);
    expect(sorted[0].id).toBe('overdue');
  });
});
