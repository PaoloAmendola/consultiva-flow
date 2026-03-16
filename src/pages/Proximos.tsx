import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useActiveLeads, useUpdateLead } from '@/hooks/useLeads';
import { useOpenTasks, useCompleteTask, useCancelTask } from '@/hooks/useTasks';
import { useCreateInteraction } from '@/hooks/useInteractions';
import { ACTION_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/database';
import { 
  format, addDays, isAfter, isBefore, startOfDay, endOfDay, differenceInDays 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  Calendar, CheckCircle, XCircle, ChevronRight, Clock, 
  AlertTriangle, ListTodo, Target, BarChart3 
} from 'lucide-react';

const Proximos = () => {
  const { data: leads, isLoading, error } = useActiveLeads();
  const { data: tasks, isLoading: tasksLoading } = useOpenTasks();
  const updateLead = useUpdateLead();
  const createInteraction = useCreateInteraction();
  const completeTask = useCompleteTask();
  const cancelTask = useCancelTask();
  const [activeTab, setActiveTab] = useState('agenda');

  const groupedByDay = useMemo(() => {
    if (!leads) return [];
    const now = new Date();
    const days: { date: Date; label: string; leads: typeof leads }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayLeads = leads.filter(lead => {
        const actionDate = new Date(lead.next_action_at);
        return isAfter(actionDate, dayStart) && isBefore(actionDate, dayEnd);
      }).sort((a, b) => new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime());
      if (dayLeads.length > 0 || i < 3) {
        days.push({
          date,
          label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : format(date, "EEEE, d 'de' MMMM", { locale: ptBR }),
          leads: dayLeads,
        });
      }
    }
    return days;
  }, [leads]);

  // Tasks grouped by day
  const tasksByDay = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    const days: { date: Date; label: string; tasks: typeof tasks }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayTasks = tasks.filter(task => {
        const dueDate = new Date(task.due_at);
        if (i === 0) return isBefore(dueDate, dayEnd); // today includes overdue
        return isAfter(dueDate, dayStart) && isBefore(dueDate, dayEnd);
      }).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
      if (dayTasks.length > 0 || i < 3) {
        days.push({ date, label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : format(date, "EEEE, d 'de' MMMM", { locale: ptBR }), tasks: dayTasks });
      }
    }
    return days;
  }, [tasks]);

  // Stats
  const overdueLeads = useMemo(() => leads?.filter(l => l.isOverdue) || [], [leads]);
  const overdueTasks = useMemo(() => tasks?.filter(t => new Date(t.due_at) < new Date()) || [], [tasks]);
  const todayLeads = groupedByDay[0]?.leads.length || 0;
  const totalActions = groupedByDay.reduce((acc, day) => acc + day.leads.length, 0);

  const handleMarkDone = async (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    if (!lead) return;
    await createInteraction.mutateAsync({ lead_id: leadId, type: 'NOTA', direction: 'OUT', content: `Ação concluída: ${lead.next_action_type}` });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await updateLead.mutateAsync({ id: leadId, data: { next_action_at: tomorrow.toISOString(), next_action_type: 'FOLLOW_UP', next_action_note: 'Acompanhamento' } });
    toast.success('Ação concluída!');
  };

  const handleReschedule = async (leadId: string) => {
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    await updateLead.mutateAsync({ id: leadId, data: { next_action_at: twoHoursFromNow.toISOString() } });
    toast.info('Reagendado para daqui 2 horas');
  };

  if (error) {
    return (
      <DashboardLayout title="Próximos 7 dias" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  const loading = isLoading || tasksLoading;

  return (
    <DashboardLayout 
      title="Próximos 7 dias" 
      subtitle={loading ? 'Carregando...' : `${totalActions} ações · ${tasks?.length || 0} tarefas`}
    >
      {/* Stats cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Card className={cn(overdueLeads.length > 0 && 'border-destructive/50')}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', overdueLeads.length > 0 ? 'bg-destructive/10' : 'bg-muted')}>
                <AlertTriangle className={cn('h-4 w-4', overdueLeads.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="text-lg font-bold">{overdueLeads.length}</p>
                <p className="text-[10px] text-muted-foreground">Atrasadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{todayLeads}</p>
                <p className="text-[10px] text-muted-foreground">Hoje</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{totalActions}</p>
                <p className="text-[10px] text-muted-foreground">7 dias</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(overdueTasks.length > 0 && 'border-warning/50')}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', overdueTasks.length > 0 ? 'bg-warning/10' : 'bg-muted')}>
                <ListTodo className={cn('h-4 w-4', overdueTasks.length > 0 ? 'text-warning' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="text-lg font-bold">{overdueTasks.length}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas atras.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: Agenda + Tarefas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="agenda" className="gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Agenda
            {totalActions > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{totalActions}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" />
            Tarefas
            {tasks && tasks.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{tasks.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          {loading ? (
            <div className="space-y-6">{[1, 2, 3].map(i => (<div key={i}><Skeleton className="h-6 w-32 mb-3" /><Skeleton className="h-48 rounded-xl" /></div>))}</div>
          ) : (
            <div className="space-y-5">
              {groupedByDay.map((day, index) => (
                <div key={day.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-2 mb-2 sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', index === 0 ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      <h2 className="text-sm font-semibold text-foreground capitalize">{day.label}</h2>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex-shrink-0">
                      {day.leads.length} ação{day.leads.length !== 1 ? 'ões' : ''}
                    </span>
                  </div>
                  {day.leads.length === 0 ? (
                    <div className="p-4 border border-dashed border-border rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">📅 Dia livre</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {day.leads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} onMarkDone={handleMarkDone} onReschedule={handleReschedule} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tarefas">
          {tasksLoading ? (
            <div className="space-y-6">{[1, 2, 3].map(i => (<div key={i}><Skeleton className="h-6 w-32 mb-3" /><Skeleton className="h-16 rounded-xl" /></div>))}</div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
              <p className="text-xs">Crie tarefas nos perfis dos leads</p>
            </div>
          ) : (
            <div className="space-y-5">
              {tasksByDay.map((day, index) => (
                <div key={day.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-2 mb-2 sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', index === 0 ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      <h2 className="text-sm font-semibold text-foreground capitalize">{day.label}</h2>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex-shrink-0">
                      {day.tasks.length} tarefa{day.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {day.tasks.length === 0 ? (
                    <div className="p-4 border border-dashed border-border rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">✅ Sem tarefas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {day.tasks.map(task => {
                        const isOverdue = new Date(task.due_at) < new Date();
                        const actionLabel = ACTION_TYPE_CONFIG[task.action_type]?.label || task.action_type;
                        return (
                          <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-lg bg-card border", isOverdue ? "border-destructive/50" : "border-border")}>
                            <div className={cn('w-1.5 h-10 rounded-full flex-shrink-0',
                              task.priority === 'P1' && 'bg-destructive',
                              task.priority === 'P2' && 'bg-warning',
                              task.priority === 'P3' && 'bg-info',
                              task.priority === 'P4' && 'bg-muted-foreground',
                            )} />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm text-foreground truncate block">{task.title}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <Badge variant="outline" className="text-[10px]">{actionLabel}</Badge>
                                <span className={cn(isOverdue && 'text-destructive font-medium')}>
                                  {isOverdue ? 'Atrasada' : format(new Date(task.due_at), "HH:mm", { locale: ptBR })}
                                </span>
                                {task.note && <span className="truncate max-w-[150px]">{task.note}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-success hover:bg-success/20 touch-manipulation" onClick={() => completeTask.mutate(task.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground hover:text-destructive touch-manipulation" onClick={() => cancelTask.mutate(task.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Link to={`/leads/${task.lead_id}`}>
                                <Button size="icon" variant="ghost" className="h-10 w-10 touch-manipulation"><ChevronRight className="h-4 w-4" /></Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Proximos;
