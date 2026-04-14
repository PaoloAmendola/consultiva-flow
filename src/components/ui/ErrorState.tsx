import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = 'Erro ao carregar dados. Tente novamente.', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-sm text-destructive mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
