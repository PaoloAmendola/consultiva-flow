import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateLeadForm } from '@/components/leads/CreateLeadForm';
import { ImportLeadsModal } from '@/components/leads/ImportLeadsModal';
import { ExportLeadsButton } from '@/components/leads/ExportLeadsButton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Clock, Filter, X } from 'lucide-react';
import { useActiveLeads } from '@/hooks/useLeads';
import { 
  ACENDER_STAGES,
  ORIGIN_LABELS,
  LeadPriority,
  mapLegacyStage,
} from '@/types/database';
import { cn } from '@/lib/utils';

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

interface LeadFilters {
  priority?: LeadPriority;
  stage?: string;
}

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data: leads, isLoading, error } = useActiveLeads();

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    return leads.filter(lead => {
      if (filters.priority && lead.priority !== filters.priority) return false;
      if (filters.stage && mapLegacyStage(lead.stage) !== filters.stage) return false;
      
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [leads, searchQuery, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const availableStages = ACENDER_STAGES;

  const clearFilters = () => setFilters({});

  if (error) {
    return (
      <DashboardLayout title="Leads" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar leads. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Leads" 
      subtitle={isLoading ? 'Carregando...' : `${filteredLeads.length} de ${leads?.length || 0} leads`}
    >
      {/* Header with search, filters and new lead */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, telefone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary h-10"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <ImportLeadsModal />
          <ExportLeadsButton />
          <CreateLeadForm />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="space-y-3 p-3 bg-secondary/50 rounded-xl animate-fade-in">
            {/* Etapa ACENDER */}
            <div>
              <span className="text-xs text-muted-foreground mb-1.5 block">Etapa:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableStages.map(stage => (
                  <Button
                    key={stage.value}
                    variant={filters.stage === stage.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setFilters(f => ({
                      ...f,
                      stage: f.stage === stage.value ? undefined : stage.value,
                    }))}
                  >
                    {stage.letter}·{stage.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="text-xs text-muted-foreground mb-1.5 block">Prioridade:</span>
              <div className="flex items-center gap-1.5">
                {PRIORITY_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={filters.priority === opt.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => setFilters(f => ({
                      ...f,
                      priority: f.priority === opt.value ? undefined : opt.value,
                    }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 w-full" onClick={clearFilters}>
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lead list */}
      <div className="space-y-2">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              {searchQuery || activeFilterCount > 0 ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeFilterCount > 0 ? 'Tente outro termo ou ajuste os filtros' : 'Clique em "Novo Lead" para começar'}
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => {
            const resolvedStage = mapLegacyStage(lead.stage);
            const currentStage = ACENDER_STAGES.find(s => s.value === resolvedStage);
            
            return (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors active:scale-[0.98] touch-manipulation"
              >
                {/* Priority indicator */}
                <div className={cn(
                  'w-1.5 h-10 rounded-full flex-shrink-0',
                  lead.priority === 'P1' && 'bg-destructive',
                  lead.priority === 'P2' && 'bg-warning',
                  lead.priority === 'P3' && 'bg-info',
                  lead.priority === 'P4' && 'bg-muted',
                )} />

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {lead.name}
                    </span>
                    {lead.isOverdue && (
                      <Clock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className={cn('text-[10px] text-white px-1.5 py-0', currentStage?.color)}>
                      {currentStage?.letter}·{currentStage?.label || lead.stage}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {ORIGIN_LABELS[lead.origin]}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leads;
