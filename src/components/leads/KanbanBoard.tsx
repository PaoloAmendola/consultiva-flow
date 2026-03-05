import { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUpdateLead, type EnrichedLead } from '@/hooks/useLeads';
import { useCreateStageChangeInteraction } from '@/hooks/useInteractions';
import {
  ACENDER_SALES_STAGES,
  ACENDER_STAGES,
  ORIGIN_LABELS,
  mapLegacyStage,
} from '@/types/database';
import { toast } from 'sonner';

interface KanbanBoardProps {
  leads: EnrichedLead[];
  searchQuery: string;
  filters: { priority?: string; stage?: string };
}

export function KanbanBoard({ leads, searchQuery, filters }: KanbanBoardProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(ACENDER_SALES_STAGES[0].value);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragLeadRef = useRef<EnrichedLead | null>(null);
  const updateLead = useUpdateLead();
  const createStageChange = useCreateStageChangeInteraction();

  // Group leads by resolved stage, excluding RECORRENCIA
  const groupedLeads = useMemo(() => {
    const groups: Record<string, EnrichedLead[]> = {};
    ACENDER_SALES_STAGES.forEach(s => { groups[s.value] = []; });

    leads.forEach(lead => {
      const resolved = mapLegacyStage(lead.stage);
      if (resolved === 'RECORRENCIA') return;

      if (filters.priority && lead.priority !== filters.priority) return;
      if (filters.stage && resolved !== filters.stage) return;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.company?.toLowerCase().includes(q) ||
          lead.tags?.some(t => t.toLowerCase().includes(q));
        if (!match) return;
      }

      if (groups[resolved]) {
        groups[resolved].push(lead);
      } else {
        groups['ATRACAO'].push(lead);
      }
    });

    return groups;
  }, [leads, searchQuery, filters]);

  const moveLeadToStage = useCallback(async (lead: EnrichedLead, targetStageValue: string) => {
    const currentResolved = mapLegacyStage(lead.stage);
    if (currentResolved === targetStageValue) return;

    const isConversion = targetStageValue === 'RECORRENCIA';

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          stage: targetStageValue,
          ...(isConversion ? { status_final: 'CONVERTIDO' as const, substatus: 'D+2' } : {}),
        },
      });

      await createStageChange.mutateAsync({
        leadId: lead.id,
        fromStage: currentResolved,
        toStage: targetStageValue,
      });

      if (isConversion) {
        toast.success(`${lead.name} convertido para Cliente! 🎉`);
      } else {
        const targetLabel = ACENDER_STAGES.find(s => s.value === targetStageValue)?.label;
        toast.success(`${lead.name} movido para ${targetLabel}`);
      }
    } catch {
      // errors handled by hooks
    }
  }, [updateLead, createStageChange]);

  const handleAdvance = async (lead: EnrichedLead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentResolved = mapLegacyStage(lead.stage);
    const currentIdx = ACENDER_STAGES.findIndex(s => s.value === currentResolved);
    if (currentIdx < 0) return;

    const nextStage = ACENDER_STAGES[currentIdx + 1];
    if (!nextStage) return;

    await moveLeadToStage(lead, nextStage.value);
  };

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, lead: EnrichedLead) => {
    dragLeadRef.current = lead;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    dragLeadRef.current = null;
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageValue: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageValue);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStageValue: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const lead = dragLeadRef.current;
    if (!lead) return;
    dragLeadRef.current = null;
    moveLeadToStage(lead, targetStageValue);
  }, [moveLeadToStage]);

  const renderLeadCard = (lead: EnrichedLead, draggable = false) => {
    const resolvedStage = mapLegacyStage(lead.stage);
    const currentStage = ACENDER_STAGES.find(s => s.value === resolvedStage);
    const currentIdx = ACENDER_STAGES.findIndex(s => s.value === resolvedStage);
    const canAdvance = currentIdx < ACENDER_STAGES.length - 1;
    const nextStage = canAdvance ? ACENDER_STAGES[currentIdx + 1] : null;
    const isLastSalesStage = resolvedStage === 'ENCERRAMENTO';

    return (
      <Link
        key={lead.id}
        to={`/leads/${lead.id}`}
        draggable={draggable}
        onDragStart={draggable ? (e) => handleDragStart(e, lead) : undefined}
        onDragEnd={draggable ? handleDragEnd : undefined}
        className={cn(
          'flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors active:scale-[0.98] touch-manipulation',
          draggable && 'cursor-grab active:cursor-grabbing'
        )}
      >
        <div className={cn(
          'w-1 h-10 rounded-full flex-shrink-0',
          lead.priority === 'P1' && 'bg-destructive',
          lead.priority === 'P2' && 'bg-warning',
          lead.priority === 'P3' && 'bg-info',
          lead.priority === 'P4' && 'bg-muted',
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-foreground text-sm truncate">{lead.name}</span>
            {lead.isOverdue && <Clock className="h-3 w-3 text-destructive flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isMobile && (
              <Badge variant="secondary" className={cn('text-[10px] text-white px-1.5 py-0', currentStage?.color)}>
                {currentStage?.letter}·{currentStage?.label || lead.stage}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{ORIGIN_LABELS[lead.origin]}</span>
            {lead.company && <span className="text-[10px] text-muted-foreground truncate">· {lead.company}</span>}
          </div>
        </div>

        {canAdvance ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 flex-shrink-0',
              isLastSalesStage && 'text-orange-500 hover:bg-orange-500/10'
            )}
            onClick={(e) => handleAdvance(lead, e)}
            title={isLastSalesStage ? 'Converter para Cliente' : `Avançar para ${nextStage?.label}`}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </Link>
    );
  };

  // MOBILE: tabs + filtered list
  if (isMobile) {
    const activeLeads = groupedLeads[activeTab] || [];

    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {ACENDER_SALES_STAGES.map(stage => {
            const count = groupedLeads[stage.value]?.length || 0;
            const isActive = activeTab === stage.value;
            return (
              <button
                key={stage.value}
                onClick={() => setActiveTab(stage.value)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  isActive
                    ? `${stage.color} text-white`
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                <span className="font-bold">{stage.letter}</span>
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isActive ? 'bg-white/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {activeLeads.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum lead nesta etapa
            </div>
          ) : (
            activeLeads.map(lead => renderLeadCard(lead, false))
          )}
        </div>
      </div>
    );
  }

  // DESKTOP: horizontal columns with drag-and-drop
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
      {ACENDER_SALES_STAGES.map(stage => {
        const stageLeads = groupedLeads[stage.value] || [];
        const isOver = dragOverStage === stage.value;
        return (
          <div key={stage.value} className="flex-shrink-0 w-64">
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-xl', stage.color)}>
              <span className="text-white font-bold text-sm">{stage.letter}</span>
              <span className="text-white/90 text-xs font-medium">{stage.label}</span>
              <span className="ml-auto bg-white/20 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {stageLeads.length}
              </span>
            </div>

            <div
              className={cn(
                'bg-secondary/30 rounded-b-xl p-2 space-y-2 min-h-[200px] transition-colors',
                isOver && 'bg-primary/10 ring-2 ring-primary/40 ring-inset'
              )}
              onDragOver={(e) => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              {stageLeads.length === 0 ? (
                <div className={cn(
                  'text-center py-6 text-xs text-muted-foreground',
                  isOver && 'text-primary font-medium'
                )}>
                  {isOver ? 'Soltar aqui' : 'Vazio'}
                </div>
              ) : (
                stageLeads.map(lead => renderLeadCard(lead, true))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
