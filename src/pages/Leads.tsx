import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateLeadForm } from '@/components/leads/CreateLeadForm';
import { ImportLeadsModal } from '@/components/leads/ImportLeadsModal';
import { ExportLeadsButton } from '@/components/leads/ExportLeadsButton';
import { KanbanBoard } from '@/components/leads/KanbanBoard';
import { LeadListView } from '@/components/leads/LeadListView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, X, Columns3, List, AlignJustify } from 'lucide-react';
import { useActiveLeads } from '@/hooks/useLeads';
import { ACENDER_SALES_STAGES, LeadPriority } from '@/types/database';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'list' | 'compact';

const VIEW_OPTIONS: { value: ViewMode; icon: React.ElementType; label: string }[] = [
  { value: 'kanban', icon: Columns3, label: 'Kanban' },
  { value: 'list', icon: List, label: 'Lista' },
  { value: 'compact', icon: AlignJustify, label: 'Compacto' },
];

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

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
      title="Pipeline"
      subtitle={isLoading ? 'Carregando...' : `${leads?.length || 0} leads ativos`}
    >
      {/* Header */}
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
            className="h-10 w-10 flex-shrink-0 relative"
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

        {/* Action buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <ImportLeadsModal />
          <ExportLeadsButton />
          <CreateLeadForm />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-3 bg-secondary/50 rounded-xl animate-fade-in">
            <div>
              <span className="text-xs text-muted-foreground mb-1.5 block">Etapa:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ACENDER_SALES_STAGES.map(stage => (
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
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 w-full" onClick={() => setFilters({})}>
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <KanbanBoard leads={leads || []} searchQuery={searchQuery} filters={filters} />
      )}
    </DashboardLayout>
  );
};

export default Leads;
