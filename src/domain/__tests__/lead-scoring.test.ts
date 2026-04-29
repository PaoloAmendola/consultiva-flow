import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../lead-scoring';
import { LeadContext } from '../nba-rules';

const baseCtx = (overrides: Partial<LeadContext> = {}): LeadContext => ({
  stage: 'ATRACAO',
  hoursOverdue: 0,
  isOverdue: false,
  hoursSinceLastTouch: 0,
  hoursSinceCreation: 1,
  hasNurtureTrack: false,
  hasLastTouch: true,
  leadName: 'Lead Teste',
  ...overrides,
});

describe('calculateLeadScore', () => {
  it('urgency is 0 when not overdue', () => {
    const score = calculateLeadScore(baseCtx());
    expect(score.urgency).toBe(0);
  });

  it('urgency caps at 100 for >=72h overdue', () => {
    const score = calculateLeadScore(baseCtx({ isOverdue: true, hoursOverdue: 100 }));
    expect(score.urgency).toBe(100);
  });

  it('urgency scales linearly for partial overdue', () => {
    const score = calculateLeadScore(baseCtx({ isOverdue: true, hoursOverdue: 36 }));
    expect(score.urgency).toBe(50);
  });

  it('potential grows as stage advances', () => {
    const early = calculateLeadScore(baseCtx({ stage: 'ATRACAO' }));
    const late = calculateLeadScore(baseCtx({ stage: 'ENCERRAMENTO' }));
    expect(late.potential).toBeGreaterThan(early.potential);
  });

  it('delay is 100 when never touched', () => {
    const score = calculateLeadScore(baseCtx({ hasLastTouch: false, hoursSinceLastTouch: Infinity }));
    expect(score.delay).toBe(100);
  });

  it('delay caps at 168h (7 days)', () => {
    const score = calculateLeadScore(baseCtx({ hoursSinceLastTouch: 500 }));
    expect(score.delay).toBe(100);
  });

  it('total is weighted composite (urgency 45%, potential 25%, delay 30%)', () => {
    // overdue 72h => urgency 100, ATRACAO => potential 0, no delay => delay 0
    // total = 100 * 0.45 = 45
    const score = calculateLeadScore(baseCtx({ isOverdue: true, hoursOverdue: 72, hoursSinceLastTouch: 0 }));
    expect(score.total).toBe(45);
  });

  it('total stays within 0-100', () => {
    const max = calculateLeadScore(baseCtx({
      stage: 'RECORRENCIA',
      isOverdue: true,
      hoursOverdue: 200,
      hoursSinceLastTouch: 500,
      hasLastTouch: false,
    }));
    expect(max.total).toBeGreaterThanOrEqual(0);
    expect(max.total).toBeLessThanOrEqual(100);
  });
});
