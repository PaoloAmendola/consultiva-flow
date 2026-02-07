import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateLeadForm } from '@/components/leads/CreateLeadForm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Clock, Filter, X } from 'lucide-react';
import { useActiveLeads } from '@/hooks/useLeads';
import { 
  PROFISSIONAL_STAGES, 
  DISTRIBUIDOR_STAGES, 
  ORIGIN_LABELS,
  LeadType,
  LeadPriority,
} from '@/types/database';
import { cn } from '@/lib/utils';

const LEAD_TYPE_OPTIONS: { value: LeadType; label: string }[] = [
  { value: 'PROFISSIONAL', label: 'Profissional' },
  { value: 'DISTRIBUIDOR', label: 'Distribuidor' },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

interface LeadFilters {
  leadType?: LeadType;
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
      if (filters.leadType && lead.lead_type !== filters.leadType) return false;
      if (filters.priority && lead.priority !== filters.priority) return false;
      if (filters.stage && lead.stage !== filters.stage) return false;
      
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

  const availableStages = useMemo(() => {
    if (filters.leadType === 'DISTRIBUIDOR') return [...DISTRIBUIDOR_STAGES];
    if (filters.leadType === 'PROFISSIONAL') return [...PROFISSIONAL_STAGES];
    return [...PROFISSIONAL_STAGES, ...DISTRIBUIDOR_STAGES].filter(
      (stage, i, arr) => arr.findIndex(s => s.value === stage.value) === i
    );
  }, [filters.leadType]);

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
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, empresa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <CreateLeadForm />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/50 rounded-xl animate-fade-in">
            {/* Lead type */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Tipo:</span>
              {LEAD_TYPE_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={filters.leadType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilters(f => ({
                    ...f,
                    leadType: f.leadType === opt.value ? undefined : opt.value,
                    stage: f.leadType === opt.value ? f.stage : undefined,
                  }))}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Priority */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Prioridade:</span>
              {PRIORITY_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={filters.priority === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilters(f => ({
                    ...f,
                    priority: f.priority === opt.value ? undefined : opt.value,
                  }))}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Stage */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Etapa:</span>
              {availableStages.slice(0, 6).map(stage => (
                <Button
                  key={stage.value}
                  variant={filters.stage === stage.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilters(f => ({
                    ...f,
                    stage: f.stage === stage.value ? undefined : stage.value,
                  }))}
                >
                  {stage.label}
                </Button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                <X className="h-3 w-3" />
                Limpar
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchQuery || activeFilterCount > 0 ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeFilterCount > 0 ? 'Tente buscar por outro termo ou ajustar os filtros' : 'Clique em "Novo Lead" para começar'}
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => {
            const stages = lead.lead_type === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
            const currentStage = stages.find(s => s.value === lead.stage);
            
            return (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                {/* Priority indicator */}
                <div className={cn(
                  'w-2 h-12 rounded-full',
                  lead.priority === 'P1' && 'bg-destructive',
                  lead.priority === 'P2' && 'bg-warning',
                  lead.priority === 'P3' && 'bg-info',
                  lead.priority === 'P4' && 'bg-muted',
                )} />

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground truncate">
                      {lead.name}
                    </span>
                    {lead.isOverdue && (
                      <Clock className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={cn('text-xs', currentStage?.color)}>
                      {currentStage?.label || lead.stage}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {ORIGIN_LABELS[lead.origin]}
                    </span>
                    {lead.company && (
                      <span className="text-xs text-muted-foreground">
                        • {lead.company}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="hidden md:flex items-center gap-1">
                  {lead.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leads;
