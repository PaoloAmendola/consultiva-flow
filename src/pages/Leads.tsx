import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateLeadForm } from '@/components/leads/CreateLeadForm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Clock } from 'lucide-react';
import { useActiveLeads } from '@/hooks/useLeads';
import { 
  PROFISSIONAL_STAGES, 
  DISTRIBUIDOR_STAGES, 
  ORIGIN_LABELS,
} from '@/types/database';
import { cn } from '@/lib/utils';

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: leads, isLoading, error } = useActiveLeads();

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    if (!searchQuery) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

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
      subtitle={isLoading ? 'Carregando...' : `${leads?.length || 0} leads ativos`}
    >
      {/* Header with search and new lead button */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, empresa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>
        <CreateLeadForm />
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
              {searchQuery ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Tente buscar por outro termo' : 'Clique em "Novo Lead" para começar'}
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
