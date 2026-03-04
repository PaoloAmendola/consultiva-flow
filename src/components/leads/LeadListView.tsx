import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Phone, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateLead, type EnrichedLead } from '@/hooks/useLeads';
import { useCreateStageChangeInteraction } from '@/hooks/useInteractions';
import {
  ACENDER_STAGES,
  ORIGIN_LABELS,
  mapLegacyStage,
} from '@/types/database';
import { toast } from 'sonner';

interface LeadListViewProps {
  leads: EnrichedLead[];
  searchQuery: string;
  filters: { priority?: string; stage?: string };
  compact?: boolean;
}

export function LeadListView({ leads, searchQuery, filters, compact = false }: LeadListViewProps) {
  const updateLead = useUpdateLead();
  const createStageChange = useCreateStageChangeInteraction();

  const filteredLeads = leads.filter(lead => {
    const resolved = mapLegacyStage(lead.stage);
    if (resolved === 'RECORRENCIA') return false;
    if (filters.priority && lead.priority !== filters.priority) return false;
    if (filters.stage && resolved !== filters.stage) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.tags?.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAdvance = async (lead: EnrichedLead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentResolved = mapLegacyStage(lead.stage);
    const currentIdx = ACENDER_STAGES.findIndex(s => s.value === currentResolved);
    if (currentIdx < 0) return;

    const nextStage = ACENDER_STAGES[currentIdx + 1];
    if (!nextStage) return;

    const isConversion = nextStage.value === 'RECORRENCIA';

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          stage: nextStage.value,
          ...(isConversion ? { status_final: 'CONVERTIDO' as const, substatus: 'D+2' } : {}),
        },
      });

      await createStageChange.mutateAsync({
        leadId: lead.id,
        fromStage: currentResolved,
        toStage: nextStage.value,
      });

      if (isConversion) {
        toast.success(`${lead.name} convertido para Cliente! 🎉`);
      }
    } catch {
      // errors handled by hooks
    }
  };

  if (filteredLeads.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Nenhum lead encontrado
      </div>
    );
  }

  if (compact) {
    return (
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {filteredLeads.map(lead => {
          const resolved = mapLegacyStage(lead.stage);
          const stage = ACENDER_STAGES.find(s => s.value === resolved);
          const currentIdx = ACENDER_STAGES.findIndex(s => s.value === resolved);
          const canAdvance = currentIdx < ACENDER_STAGES.length - 1;

          return (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className={cn('w-1.5 h-6 rounded-full flex-shrink-0', stage?.color)} />
              <span className="font-medium text-sm text-foreground truncate flex-1">{lead.name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex-shrink-0">
                {stage?.letter}
              </Badge>
              {lead.isOverdue && <Clock className="h-3 w-3 text-destructive flex-shrink-0" />}
              {canAdvance && (
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => handleAdvance(lead, e)}>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  // Full list view
  return (
    <div className="space-y-2">
      {filteredLeads.map(lead => {
        const resolved = mapLegacyStage(lead.stage);
        const stage = ACENDER_STAGES.find(s => s.value === resolved);
        const currentIdx = ACENDER_STAGES.findIndex(s => s.value === resolved);
        const canAdvance = currentIdx < ACENDER_STAGES.length - 1;
        const nextStage = canAdvance ? ACENDER_STAGES[currentIdx + 1] : null;
        const isLastSalesStage = resolved === 'ENCERRAMENTO';

        return (
          <Link
            key={lead.id}
            to={`/leads/${lead.id}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
          >
            <div className={cn('w-1.5 self-stretch rounded-full flex-shrink-0', stage?.color)} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground truncate">{lead.name}</span>
                {lead.isOverdue && <Clock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] text-white px-1.5 py-0 ml-auto flex-shrink-0', stage?.color)}
                >
                  {stage?.letter}·{stage?.label}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
                {lead.company && (
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3" />
                    {lead.company}
                  </span>
                )}
                <span>{ORIGIN_LABELS[lead.origin]}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {lead.priority}
                </Badge>
              </div>
            </div>

            {canAdvance && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-shrink-0 gap-1 text-xs',
                  isLastSalesStage && 'text-orange-500 hover:bg-orange-500/10'
                )}
                onClick={(e) => handleAdvance(lead, e)}
                title={isLastSalesStage ? 'Converter para Cliente' : `Avançar para ${nextStage?.label}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isLastSalesStage ? 'Converter' : 'Avançar'}</span>
              </Button>
            )}
          </Link>
        );
      })}
    </div>
  );
}
