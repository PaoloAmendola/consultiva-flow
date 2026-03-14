import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { FilterBar, LeadFilters } from '@/components/leads/FilterBar';
import { CreateLeadForm } from '@/components/leads/CreateLeadForm';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { PipelineSummary } from '@/components/dashboard/PipelineSummary';
import { TaskList } from '@/components/tasks/TaskList';
import { useActionableLeads, useUpdateLead } from '@/hooks/useLeads';
import { useCreateInteraction } from '@/hooks/useInteractions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [filters, setFilters] = useState<LeadFilters>({});
  const { data: leads, isLoading, error } = useActionableLeads();
  const updateLead = useUpdateLead();
  const createInteraction = useCreateInteraction();

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    return leads.filter(lead => {
      if (filters.leadType?.length && !filters.leadType.includes(lead.lead_type)) return false;
      if (filters.priority?.length && !filters.priority.includes(lead.priority)) return false;
      if (filters.origin?.length && !filters.origin.includes(lead.origin)) return false;
      return true;
    });
  }, [leads, filters]);

  const handleMarkDone = async (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    if (!lead) return;

    await createInteraction.mutateAsync({
      lead_id: leadId,
      type: 'NOTA',
      direction: 'OUT',
      content: `Ação concluída: ${lead.next_action_type}`,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await updateLead.mutateAsync({
      id: leadId,
      data: {
        next_action_at: tomorrow.toISOString(),
        next_action_type: 'FOLLOW_UP',
        next_action_note: 'Acompanhamento',
      },
    });

    toast.success('Ação concluída! Próxima ação agendada para amanhã.');
  };

  const handleReschedule = async (leadId: string) => {
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    await updateLead.mutateAsync({
      id: leadId,
      data: {
        next_action_at: twoHoursFromNow.toISOString(),
      },
    });

    toast.info('Reagendado para daqui 2 horas');
  };

  const overdueCount = filteredLeads.filter(l => l.isOverdue).length;
  const subtitle = isLoading 
    ? 'Carregando...'
    : overdueCount > 0 
      ? `${overdueCount} ação${overdueCount > 1 ? 'ões' : ''} vencida${overdueCount > 1 ? 's' : ''}`
      : `${filteredLeads.length} ações pendentes`;

  if (error) {
    return (
      <DashboardLayout title="Agora" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar leads. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Agora" 
      subtitle={subtitle}
    >
      {/* Metrics Section */}
      <div className="mb-4 lg:mb-6">
        <MetricsCards />
      </div>

      <div className="grid gap-3 lg:gap-6 lg:grid-cols-3">
        {/* Main content - Actions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <FilterBar 
              onFilterChange={setFilters}
              activeFilters={filters}
            />
            <CreateLeadForm />
          </div>

          <div className="grid gap-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Tudo em dia! 🎉
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhuma ação pendente no momento
                </p>
                <CreateLeadForm />
              </div>
            ) : (
              filteredLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onMarkDone={handleMarkDone}
                  onReschedule={handleReschedule}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar - Tasks + Pipeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 px-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Tarefas Pendentes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4">
              <TaskList maxItems={5} />
            </CardContent>
          </Card>

          <PipelineSummary />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
