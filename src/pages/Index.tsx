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
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultNextAction, getRescheduleUpdate } from '@/domain/stage-transitions';

const Index = () => {
  const [filters, setFilters] = useState<LeadFilters>({});
  const { data: leads, isLoading, error, refetch } = useActionableLeads();
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

    const nextAction = getDefaultNextAction();
    await updateLead.mutateAsync({ id: leadId, data: nextAction });
    toast.success('Ação concluída! Próxima ação agendada para amanhã.');
  };

  const handleReschedule = async (leadId: string) => {
    const reschedule = getRescheduleUpdate();
    await updateLead.mutateAsync({ id: leadId, data: reschedule });
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
        <ErrorState onRetry={() => refetch()} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agora" subtitle={subtitle}>
      <div className="mb-4 lg:mb-6">
        <MetricsCards />
      </div>

      <div className="grid gap-3 lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <FilterBar onFilterChange={setFilters} activeFilters={filters} />
            <CreateLeadForm />
          </div>

          <div className="grid gap-3">
            {isLoading ? (
              <LoadingSkeleton variant="card" count={3} />
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="Tudo em dia! 🎉"
                description="Nenhuma ação pendente no momento"
                action={<CreateLeadForm />}
              />
            ) : (
              filteredLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onMarkDone={handleMarkDone} onReschedule={handleReschedule} />
              ))
            )}
          </div>
        </div>

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
