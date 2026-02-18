import { cn } from '@/lib/utils';
import { ACENDER_STAGES } from '@/types/database';
import { Check } from 'lucide-react';

interface PipelineStepperProps {
  currentStage: string;
}

export function PipelineStepper({ currentStage }: PipelineStepperProps) {
  const currentIndex = ACENDER_STAGES.findIndex(s => s.value === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {ACENDER_STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={stage.value} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  isCompleted && `${stage.color} border-transparent text-white`,
                  isCurrent && `bg-transparent border-2 ${stage.textColor}`,
                  !isCompleted && !isCurrent && 'bg-muted border-border text-muted-foreground',
                )}
                style={isCurrent ? { borderColor: 'currentColor' } : undefined}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : stage.letter}
              </div>
              <span className={cn(
                'text-[10px] max-w-[60px] text-center leading-tight',
                isCurrent ? `${stage.textColor} font-semibold` : 'text-muted-foreground',
              )}>
                {stage.label}
              </span>
            </div>
            {index < ACENDER_STAGES.length - 1 && (
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
