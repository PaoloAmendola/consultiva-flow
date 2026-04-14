import { describe, it, expect } from 'vitest';
import { getDefaultNextAction, getRescheduleUpdate, getNextStage, shouldConvertOnAdvance, getConversionUpdate } from '../stage-transitions';

describe('Stage Transitions', () => {
  it('getDefaultNextAction returns tomorrow at 9am', () => {
    const action = getDefaultNextAction();
    expect(action.next_action_type).toBe('FOLLOW_UP');
    expect(action.next_action_note).toBe('Acompanhamento');
    const date = new Date(action.next_action_at);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
  });

  it('getRescheduleUpdate returns ~2h from now', () => {
    const before = Date.now();
    const update = getRescheduleUpdate();
    const date = new Date(update.next_action_at!);
    const diff = date.getTime() - before;
    // Should be roughly 2 hours (allow 1 min margin)
    expect(diff).toBeGreaterThan(2 * 60 * 60 * 1000 - 60000);
    expect(diff).toBeLessThan(2 * 60 * 60 * 1000 + 60000);
  });

  it('getNextStage progresses through ACENDER', () => {
    expect(getNextStage('ATRACAO')).toBe('CONEXAO');
    expect(getNextStage('CONEXAO')).toBe('ENQUADRAMENTO');
    expect(getNextStage('ENCERRAMENTO')).toBe('RECORRENCIA');
    expect(getNextStage('RECORRENCIA')).toBeNull();
  });

  it('shouldConvertOnAdvance only for ENCERRAMENTO', () => {
    expect(shouldConvertOnAdvance('ENCERRAMENTO')).toBe(true);
    expect(shouldConvertOnAdvance('DEMONSTRACAO')).toBe(false);
  });

  it('getConversionUpdate sets correct fields', () => {
    const update = getConversionUpdate();
    expect(update.stage).toBe('RECORRENCIA');
    expect(update.status_final).toBe('CONVERTIDO');
    expect(update.substatus).toBe('D+2');
  });
});
