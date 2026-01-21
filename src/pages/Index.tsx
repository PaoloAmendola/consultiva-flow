import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { FilterBar } from '@/components/leads/FilterBar';
import { mockLeads } from '@/data/mockData';
import { toast } from 'sonner';

const Index = () => {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Filter leads that need action NOW (overdue or due soon)
  const actionableLeads = useMemo(() => {
    const now = new Date();
    
    return mockLeads
      .filter(lead => {
        const actionDate = new Date(lead.nextActionAt);
        const hoursUntilDue = (actionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Show leads due within next 4 hours or overdue
        return hoursUntilDue <= 4 && lead.statusFinal === 'ATIVO';
      })
      .filter(lead => {
        // Apply filters
        if (filters.pipeline?.length && !filters.pipeline.includes(lead.leadType)) return false;
        if (filters.priority?.length && !filters.priority.includes(lead.priority)) return false;
        if (filters.origin?.length && !filters.origin.includes(lead.origin)) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by priority first, then by due date
        const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime();
      });
  }, [filters]);

  const handleMarkDone = (leadId: string) => {
    toast.success('Ação marcada como concluída!');
  };

  const handleReschedule = (leadId: string) => {
    toast.info('Em breve: Reagendar ação');
  };

  const overdueCount = actionableLeads.filter(l => l.isOverdue).length;
  const subtitle = overdueCount > 0 
    ? `${overdueCount} ação${overdueCount > 1 ? 'ões' : ''} vencida${overdueCount > 1 ? 's' : ''}`
    : `${actionableLeads.length} ações pendentes`;

  return (
    <AppLayout 
      title="Agora" 
      subtitle={subtitle}
    >
      <FilterBar 
        onFilterChange={setFilters}
        activeFilters={filters}
      />

      <div className="p-4 space-y-4">
        {actionableLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Tudo em dia! 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              Nenhuma ação pendente no momento
            </p>
          </div>
        ) : (
          actionableLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onMarkDone={handleMarkDone}
              onReschedule={handleReschedule}
            />
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
