import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useOpenTasks, useCompleteTask, useCancelTask } from '@/hooks/useTasks';
import { useActiveLeads } from '@/hooks/useLeads';
import { ACTION_TYPE_CONFIG, DbTask } from '@/types/database';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface TaskListProps {
  tasks?: DbTask[];
  showLeadName?: boolean;
  maxItems?: number;
}

export function TaskList({ tasks: externalTasks, showLeadName = true, maxItems = 10 }: TaskListProps) {
  const { data: internalTasks, isLoading } = useOpenTasks();
  const { data: leads } = useActiveLeads();
  const completeTask = useCompleteTask();
  const cancelTask = useCancelTask();

  const tasks = externalTasks ?? internalTasks;
  const loading = externalTasks === undefined ? isLoading : false;

  // Build lead name lookup
  const leadNames = useMemo(() => {
    if (!leads) return {};
    return Object.fromEntries(leads.map(l => [l.id, l.name]));
  }, [leads]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Nenhuma tarefa pendente</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-2">
      {tasks.slice(0, maxItems).map(task => {
        const isOverdue = new Date(task.due_at) < now;
        const actionLabel = ACTION_TYPE_CONFIG[task.action_type]?.label || task.action_type;
        const leadName = showLeadName ? leadNames[task.lead_id] : null;
        
        return (
          <div 
            key={task.id} 
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border",
              isOverdue ? "border-destructive/50" : "border-transparent"
            )}
          >
            <div className={cn(
              'w-1.5 h-10 rounded-full flex-shrink-0',
              task.priority === 'P1' && 'bg-destructive',
              task.priority === 'P2' && 'bg-warning',
              task.priority === 'P3' && 'bg-info',
              task.priority === 'P4' && 'bg-muted-foreground',
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm text-foreground truncate">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {actionLabel}
                </Badge>
                {leadName && (
                  <span className="truncate max-w-[120px]">👤 {leadName}</span>
                )}
                <span className={cn(isOverdue && 'text-destructive')}>
                  {isOverdue ? 'Atrasada' : format(new Date(task.due_at), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-success hover:text-success hover:bg-success/20"
                onClick={() => completeTask.mutate(task.id)}
                disabled={completeTask.isPending}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                onClick={() => cancelTask.mutate(task.id)}
                disabled={cancelTask.isPending}
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <Link to={`/leads/${task.lead_id}`}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
