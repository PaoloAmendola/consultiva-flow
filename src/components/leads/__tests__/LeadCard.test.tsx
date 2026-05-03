import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadCard } from '../LeadCard';
import type { EnrichedLead } from '@/hooks/useLeads';

// Avoid hitting Supabase in tests
vi.mock('@/hooks/useScripts', () => ({
  useScripts: () => ({ data: [] }),
}));
vi.mock('./QuickCoachTip', () => ({
  QuickCoachTip: () => null,
}));

const baseLead: EnrichedLead = {
  id: 'lead-1',
  user_id: 'u1',
  name: 'João Cabeleireiro',
  phone: '11999999999',
  email: null,
  stage: 'NOVO_LEAD',
  origin: 'INSTAGRAM',
  lead_type: 'PROFISSIONAL',
  priority: 'P1',
  status_final: 'ATIVO',
  next_action_type: 'WHATSAPP',
  next_action_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  next_action_note: 'Fazer primeiro contato',
  last_touch_at: null,
  nurture_step: 0,
  nurture_track_id: null,
  notion_page_id: null,
  tags: [],
  score: 0,
  substatus: null,
  state: null,
  city: null,
  company: 'Salão Top',
  observations: null,
  synced_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  // NBA enrichment
  isOverdue: true,
  overdueReason: 'Atrasado há 1h',
  suggestedMessage: 'Olá {nome}, tudo bem?',
} as unknown as EnrichedLead;

function renderCard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LeadCard lead={baseLead} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LeadCard', () => {
  it('renders lead name and overdue reason', () => {
    renderCard();
    expect(screen.getByText('João Cabeleireiro')).toBeInTheDocument();
    expect(screen.getByText('Atrasado há 1h')).toBeInTheDocument();
  });

  it('renders WhatsApp action button', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
  });

  it('shows score indicator', () => {
    renderCard();
    expect(screen.getByText(/score/i)).toBeInTheDocument();
  });
});
