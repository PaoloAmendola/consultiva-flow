import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';

describe('BottomNav', () => {
  it('renders all main navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>,
    );
    for (const label of ['Agora', 'Leads', 'Clientes', 'Gerencial', 'Playbooks']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('marks the active route with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/leads']}>
        <BottomNav />
      </MemoryRouter>,
    );
    const leadsLink = screen.getByText('Leads').closest('a');
    expect(leadsLink).toHaveAttribute('aria-current', 'page');
  });
});
