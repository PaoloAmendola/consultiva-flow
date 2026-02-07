import { cn } from '@/lib/utils';
import { PROFISSIONAL_STAGES, DISTRIBUIDOR_STAGES, LeadType } from '@/types/database';
import { Check } from 'lucide-react';

interface PipelineStepperProps {
  leadType: LeadType;
  currentStage: string;
}

export function PipelineStepper({ leadType, currentStage }: PipelineStepperProps) {
  const stages = leadType === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
  const currentIndex = stages.findIndex(s => s.value === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLost = stage.value === 'FECHADO_PERDEU' && currentStage === 'FECHADO_PERDEU';

        return (
          <div key={stage.value} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  isLost && 'bg-destructive border-destructive text-destructive-foreground',
                  isCompleted && !isLost && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && !isLost && 'bg-primary/20 border-primary text-primary',
                  !isCompleted && !isCurrent && !isLost && 'bg-muted border-border text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span className={cn(
                'text-[10px] max-w-[60px] text-center leading-tight',
                isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                'w-4 h-0.5 mx-0.5 mt-[-16px]',
                index < currentIndex ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
