import { useState } from 'react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, ChevronRight, Clock, CalendarClock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useOpenTasks, useCompleteTask, useCancelTask, useUpdateTask } from '@/hooks/useTasks';
import { useActiveLeads } from '@/hooks/useLeads';
import { ACTION_TYPE_CONFIG, DbTask } from '@/types/database';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { toast } from 'sonner';

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
  const updateTask = useUpdateTask();

  const tasks = externalTasks ?? internalTasks;
  const loading = externalTasks === undefined ? isLoading : false;

  const leadNames = useMemo(() => {
    if (!leads) return {};
    return Object.fromEntries(leads.map(l => [l.id, l.name]));
  }, [leads]);

  // Sort: overdue first, then by due_at
  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    return [...tasks].sort((a, b) => {
      const aOverdue = isPast(new Date(a.due_at));
      const bOverdue = isPast(new Date(b.due_at));
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      // By priority
      const pMap = { P1: 4, P2: 3, P3: 2, P4: 1 };
      const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });
  }, [tasks]);

  const handleReschedule = async (task: DbTask) => {
    const twoHours = new Date();
    twoHours.setHours(twoHours.getHours() + 2);
    await updateTask.mutateAsync({ id: task.id, data: { due_at: twoHours.toISOString() } });
    toast.info('Tarefa reagendada para daqui 2h');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Nenhuma tarefa pendente</p>
      </div>
    );
  }

  const now = new Date();

  const formatDueLabel = (dueAt: string) => {
    const date = new Date(dueAt);
    if (isPast(date)) {
      const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (hoursAgo < 1) return 'Agora';
      if (hoursAgo < 24) return `${hoursAgo}h atrás`;
      return `${Math.floor(hoursAgo / 24)}d atrás`;
    }
    if (isToday(date)) return `Hoje ${format(date, 'HH:mm')}`;
    if (isTomorrow(date)) return `Amanhã ${format(date, 'HH:mm')}`;
    return format(date, "dd/MM HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-2">
      {sortedTasks.slice(0, maxItems).map(task => {
        const isOverdue = isPast(new Date(task.due_at));
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
                <Badge variant="outline" className="text-[10px]">
                  {actionLabel}
                </Badge>
                {leadName && (
                  <span className="truncate max-w-[120px]">👤 {leadName}</span>
                )}
                <span className={cn('flex items-center gap-0.5', isOverdue && 'text-destructive font-medium')}>
                  <Clock className="h-3 w-3" />
                  {formatDueLabel(task.due_at)}
                </span>
              </div>
              {task.note && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="h-2.5 w-2.5" />
                  <span className="truncate">{task.note}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/20"
                onClick={() => completeTask.mutate(task.id)}
                disabled={completeTask.isPending}
                title="Concluir"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              {isOverdue && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-warning"
                  onClick={() => handleReschedule(task)}
                  title="Adiar 2h"
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                onClick={() => cancelTask.mutate(task.id)}
                disabled={cancelTask.isPending}
                title="Cancelar"
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <Link to={`/leads/${task.lead_id}`}>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" title="Ver lead">
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
