import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Check, Circle } from 'lucide-react';
import { useClientLeads, useUpdateLead, type EnrichedLead } from '@/hooks/useLeads';
import { RECORRENCIA_SUBSTAGES, ORIGIN_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Clientes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubstage, setActiveSubstage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { data: clients, isLoading, error } = useClientLeads();
  const updateLead = useUpdateLead();

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      if (activeSubstage && (c.substatus || 'D+2') !== activeSubstage) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.company?.toLowerCase().includes(q);
    });
  }, [clients, searchQuery, activeSubstage]);

  const getSubstageIndex = (substatus: string | null) => {
    const idx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === (substatus || 'D+2'));
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceSubstage = async (client: EnrichedLead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = getSubstageIndex(client.substatus);
    if (currentIdx >= RECORRENCIA_SUBSTAGES.length - 1) return;
    const next = RECORRENCIA_SUBSTAGES[currentIdx + 1];
    await updateLead.mutateAsync({ id: client.id, data: { substatus: next.value } });
  };

  if (error) {
    return (
      <DashboardLayout title="Clientes" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar clientes. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Clientes"
      subtitle={isLoading ? 'Carregando...' : `${filteredClients.length} clientes`}
    >
      {/* Search */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary h-10"
          />
        </div>

        {/* Substage filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveSubstage(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
              !activeSubstage ? 'bg-zinc-700 text-white' : 'bg-secondary text-muted-foreground'
            )}
          >
            Todos
          </button>
          {RECORRENCIA_SUBSTAGES.map(sub => (
            <button
              key={sub.value}
              onClick={() => setActiveSubstage(activeSubstage === sub.value ? null : sub.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                activeSubstage === sub.value ? 'bg-zinc-700 text-white' : 'bg-secondary text-muted-foreground'
              )}
            >
              {sub.value}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Leads convertidos aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          filteredClients.map(client => {
            const currentSubIdx = getSubstageIndex(client.substatus);
            const currentSub = RECORRENCIA_SUBSTAGES[currentSubIdx];
            const canAdvance = currentSubIdx < RECORRENCIA_SUBSTAGES.length - 1;

            return (
              <Link
                key={client.id}
                to={`/leads/${client.id}`}
                className="block p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground text-sm truncate flex-1">{client.name}</span>
                  {canAdvance && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 flex-shrink-0"
                      onClick={(e) => handleAdvanceSubstage(client, e)}
                    >
                      Avançar
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Mini timeline */}
                <div className="flex items-center gap-0.5 mb-2 overflow-x-auto scrollbar-hide">
                  {RECORRENCIA_SUBSTAGES.map((sub, idx) => {
                    const isCompleted = idx < currentSubIdx;
                    const isCurrent = idx === currentSubIdx;
                    return (
                      <div key={sub.value} className="flex items-center flex-shrink-0">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors',
                          isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                          isCurrent && 'border-zinc-500 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800',
                          !isCompleted && !isCurrent && 'border-border text-muted-foreground bg-muted',
                        )}>
                          {isCompleted ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                        </div>
                        {idx < RECORRENCIA_SUBSTAGES.length - 1 && (
                          <div className={cn(
                            'w-3 h-0.5',
                            idx < currentSubIdx ? 'bg-emerald-500' : 'bg-border'
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] bg-zinc-700 text-white px-1.5 py-0">
                    {currentSub?.value} · {currentSub?.label}
                  </Badge>
                  <span>{ORIGIN_LABELS[client.origin]}</span>
                  {client.company && <span>· {client.company}</span>}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
