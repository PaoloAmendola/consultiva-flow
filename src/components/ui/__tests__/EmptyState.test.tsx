import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Inbox } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Inbox} title="Nada por aqui" description="Sem itens para mostrar" />);
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
    expect(screen.getByText('Sem itens para mostrar')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Vazio"
        action={<button>Criar</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });
});
