import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { mockLeads } from '@/data/mockData';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Proximos = () => {
  const groupedByDay = useMemo(() => {
    const now = new Date();
    const days: { date: Date; label: string; leads: typeof mockLeads }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayLeads = mockLeads.filter(lead => {
        const actionDate = new Date(lead.nextActionAt);
        return (
          isAfter(actionDate, dayStart) &&
          isBefore(actionDate, dayEnd) &&
          lead.statusFinal === 'ATIVO'
        );
      }).sort((a, b) => 
        new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime()
      );

      if (dayLeads.length > 0 || i < 3) { // Always show at least 3 days
        days.push({
          date,
          label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : format(date, "EEEE, d 'de' MMMM", { locale: ptBR }),
          leads: dayLeads,
        });
      }
    }

    return days;
  }, []);

  const totalActions = groupedByDay.reduce((acc, day) => acc + day.leads.length, 0);

  return (
    <AppLayout 
      title="Próximos 7 dias" 
      subtitle={`${totalActions} ações agendadas`}
    >
      <div className="p-4 space-y-6">
        {groupedByDay.map((day, index) => (
          <div key={day.label} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {day.label}
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {day.leads.length} ação{day.leads.length !== 1 ? 'ões' : ''}
              </span>
            </div>

            {day.leads.length === 0 ? (
              <div className="p-4 border border-dashed border-border rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Nenhuma ação agendada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {day.leads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Proximos;
