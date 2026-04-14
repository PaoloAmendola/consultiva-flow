import { describe, it, expect } from 'vitest';
import { evaluateRules, LeadContext } from '../nba-rules';

function makeCtx(overrides: Partial<LeadContext> = {}): LeadContext {
  return {
    stage: 'ATRACAO',
    hoursOverdue: 0,
    isOverdue: false,
    hoursSinceLastTouch: 0,
    hoursSinceCreation: 0,
    hasNurtureTrack: false,
    hasLastTouch: true,
    leadName: 'Test',
    ...overrides,
  };
}

describe('NBA Rules', () => {
  it('matches ATRACAO rule when no first contact after 1h', () => {
    const rule = evaluateRules(makeCtx({ stage: 'ATRACAO', hasLastTouch: false, hoursSinceCreation: 2 }));
    expect(rule).not.toBeNull();
    expect(rule!.id).toBe('atracao-no-contact');
    expect(rule!.priority).toBe('P1');
  });

  it('does not match ATRACAO if already touched', () => {
    const rule = evaluateRules(makeCtx({ stage: 'ATRACAO', hasLastTouch: true, hoursSinceCreation: 2 }));
    expect(rule).toBeNull();
  });

  it('matches CONEXAO rule when stale > 24h', () => {
    const rule = evaluateRules(makeCtx({ stage: 'CONEXAO', hoursSinceLastTouch: 30 }));
    expect(rule!.id).toBe('conexao-stale');
  });

  it('matches NUTRICAO rule when stale > 48h', () => {
    const rule = evaluateRules(makeCtx({ stage: 'NUTRICAO', hoursSinceLastTouch: 50 }));
    expect(rule!.id).toBe('nutricao-stale');
    expect(rule!.assetCode).toBe('A1');
  });

  it('matches ENCERRAMENTO with P1 priority', () => {
    const rule = evaluateRules(makeCtx({ stage: 'ENCERRAMENTO', hoursSinceLastTouch: 30 }));
    expect(rule!.priority).toBe('P1');
  });

  it('matches RECORRENCIA only after 7 days', () => {
    const rule24 = evaluateRules(makeCtx({ stage: 'RECORRENCIA', hoursSinceLastTouch: 24 }));
    expect(rule24).toBeNull();
    const rule170 = evaluateRules(makeCtx({ stage: 'RECORRENCIA', hoursSinceLastTouch: 170 }));
    expect(rule170!.id).toBe('recorrencia-7d');
  });

  it('falls back to ghost rule for unknown stage', () => {
    const rule = evaluateRules(makeCtx({ stage: 'UNKNOWN', hoursSinceLastTouch: 50 }));
    expect(rule!.id).toBe('ghost-24-72h');
  });

  it('ghost 72h+ rule takes precedence over 24-72h', () => {
    const rule = evaluateRules(makeCtx({ stage: 'UNKNOWN', hoursSinceLastTouch: 100 }));
    // 100h matches both, but ghost-24-72h comes first and condition excludes >72h
    expect(rule!.id).toBe('ghost-72h-plus');
  });
});
