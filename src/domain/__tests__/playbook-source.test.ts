import { describe, it, expect } from 'vitest';
import { getPlaybookSource } from '../playbook-source';

describe('getPlaybookSource', () => {
  it('returns default when no playbooks exist', () => {
    expect(getPlaybookSource({ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' as any }, [])).toBe('default');
    expect(getPlaybookSource({ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' as any }, undefined)).toBe('default');
  });

  it('returns custom when matching playbook found', () => {
    const playbooks = [{ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' }];
    expect(getPlaybookSource({ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' as any }, playbooks)).toBe('custom');
  });

  it('returns default when stage matches but lead_type differs', () => {
    const playbooks = [{ stage: 'CONEXAO', lead_type: 'CONSUMIDOR' }];
    expect(getPlaybookSource({ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' as any }, playbooks)).toBe('default');
  });

  it('maps legacy stage names', () => {
    const playbooks = [{ stage: 'CONEXAO', lead_type: 'PROFISSIONAL' }];
    // NOVO_LEAD legacy → ATRACAO; should not match CONEXAO
    expect(getPlaybookSource({ stage: 'NOVO_LEAD', lead_type: 'PROFISSIONAL' as any }, playbooks)).toBe('default');
  });
});
