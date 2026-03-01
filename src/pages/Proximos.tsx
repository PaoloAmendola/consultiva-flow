import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveLeads, useUpdateLead } from '@/hooks/useLeads';
import { useCreateInteraction } from '@/hooks/useInteractions';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Proximos = () => {
  const { data: leads, isLoading, error } = useActiveLeads();
  const updateLead = useUpdateLead();
  const createInteraction = useCreateInteraction();

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
        return (
          isAfter(actionDate, dayStart) &&
          isBefore(actionDate, dayEnd)
        );
      }).sort((a, b) => 
        new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime()
      );

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

    toast.success('Ação concluída!');
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

  const totalActions = groupedByDay.reduce((acc, day) => acc + day.leads.length, 0);

  if (error) {
    return (
      <DashboardLayout title="Próximos 7 dias" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar leads. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Próximos 7 dias" 
      subtitle={isLoading ? 'Carregando...' : `${totalActions} ações agendadas`}
    >
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDay.map((day, index) => (
            <div key={day.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center gap-2 mb-2 sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-foreground capitalize">
                    {day.label}
                  </h2>
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
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onMarkDone={handleMarkDone}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Proximos;
