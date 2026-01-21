import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showFab?: boolean;
  onFabClick?: () => void;
}

export function AppLayout({ children, title, subtitle, showFab, onFabClick }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} subtitle={subtitle} />
      
      <main className="flex-1 pb-20 content-scroll">
        {children}
      </main>

      {showFab && (
        <button
          onClick={onFabClick}
          className="fab"
          aria-label="Adicionar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <BottomNav />
    </div>
  );
}
