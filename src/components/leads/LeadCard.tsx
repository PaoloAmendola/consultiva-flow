import { 
  MessageCircle, Phone, CheckCircle, Clock, ChevronRight,
  FileText, Copy, ExternalLink, ScrollText, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EnrichedLead } from '@/hooks/useLeads';
import { useScripts } from '@/hooks/useScripts';
import { 
  ACENDER_STAGES, ORIGIN_LABELS, ACTION_TYPE_CONFIG, STAGE_GUIDANCE, mapLegacyStage,
} from '@/types/database';
import { buildLeadContext } from '@/domain/nba-engine';
import { calculateLeadScore } from '@/domain/lead-scoring';
import { QuickCoachTip } from './QuickCoachTip';
import { useState } from 'react';

interface LeadCardProps {
  lead: EnrichedLead;
  onMarkDone?: (leadId: string) => void;
  onReschedule?: (leadId: string) => void;
}

export function LeadCard({ lead, onMarkDone, onReschedule }: LeadCardProps) {
  const resolvedStage = mapLegacyStage(lead.stage);
  const currentStage = ACENDER_STAGES.find(s => s.value === resolvedStage);
  const guidance = STAGE_GUIDANCE[resolvedStage];
  const { data: scripts } = useScripts(resolvedStage);
  const [showScripts, setShowScripts] = useState(false);

  // Compute operational score
  const ctx = buildLeadContext(lead);
  const score = calculateLeadScore(ctx);
  
  const isP1 = lead.priority === 'P1';

  const handleCopyMessage = (message?: string) => {
    const msg = message || lead.suggestedMessage;
    if (msg) {
      const parsed = msg.replace('{nome}', lead.name.split(' ')[0]);
      navigator.clipboard.writeText(parsed);
      toast.success('Copiado!');
    }
  };

  const handleWhatsApp = (message?: string) => {
    const phone = lead.phone.replace(/\D/g, '');
    const msg = message || lead.suggestedMessage;
    const text = msg 
      ? encodeURIComponent(msg.replace('{nome}', lead.name.split(' ')[0]))
      : '';
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:+55${lead.phone.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className={cn('action-card animate-fade-in', isP1 && 'action-card-urgent')}>
      {/* Header: dot + name + stage + discrete score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                lead.priority === 'P1' && 'bg-destructive',
                lead.priority === 'P2' && 'bg-warning',
                lead.priority === 'P3' && 'bg-info',
                lead.priority === 'P4' && 'bg-muted-foreground',
              )}
              aria-label={`Prioridade ${lead.priority}`}
            />
            <Link 
              to={`/leads/${lead.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {lead.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge 
              variant="secondary" 
              className={cn('text-[10px] text-white px-1.5 py-0', currentStage?.color)}
            >
              {currentStage?.letter}·{currentStage?.label || lead.stage}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {ORIGIN_LABELS[lead.origin]}
            </span>
            {lead.company && (
              <span className="text-[10px] text-muted-foreground truncate">• {lead.company}</span>
            )}
          </div>
        </div>
        {/* Discrete score */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono leading-none">
            score
          </span>
          <div className="flex items-center gap-1.5 w-16">
            <Progress value={score.total} className="h-1" />
            <span className="text-[10px] text-foreground font-mono tabular-nums">{score.total}</span>
          </div>
        </div>
      </div>

      {/* Overdue */}
      {lead.overdueReason && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-destructive/10">
          <Clock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          <span className="text-xs text-destructive font-medium">{lead.overdueReason}</span>
        </div>
      )}

      {/* O QUE FAZER AGORA */}
      <div className="mb-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-[10px] text-primary uppercase tracking-wide font-semibold mb-0.5">
          🎯 O que fazer agora
        </p>
        <p className="text-xs text-foreground font-medium leading-relaxed">
          {lead.next_action_note || guidance?.instruction || ACTION_TYPE_CONFIG[lead.next_action_type]?.label}
        </p>
        {guidance?.goal && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Objetivo: {guidance.goal}
          </p>
        )}
      </div>

      {/* O QUE FALAR - suggested message */}
      {lead.suggestedMessage && (
        <div className="mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
            💬 O que falar
          </p>
          <div className="bg-secondary/50 rounded-lg p-2.5 relative">
            <p className="text-xs text-foreground pr-7 leading-relaxed">
              {lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0])}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-9 w-9 touch-manipulation"
              onClick={() => handleCopyMessage()}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* O QUE ENVIAR */}
      {lead.suggestedAssetCode && (
        <div className="mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
            📎 O que enviar
          </p>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2.5">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground flex-1 truncate">Asset: {lead.suggestedAssetCode}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 touch-manipulation">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* SCRIPTS - collapsible */}
      {scripts && scripts.length > 0 && (
        <div className="mb-2">
          <button 
            onClick={() => setShowScripts(!showScripts)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide mb-1 hover:text-foreground transition-colors"
          >
            <ScrollText className="h-3 w-3" />
            Scripts prontos ({scripts.length})
            <ChevronRight className={cn('h-3 w-3 transition-transform', showScripts && 'rotate-90')} />
          </button>
          {showScripts && (
            <div className="space-y-1.5 animate-fade-in">
              {scripts.slice(0, 4).map(script => (
                <div key={script.id} className="flex items-center gap-1.5 bg-secondary/30 rounded-lg p-2">
                  <span className="text-[11px] text-foreground flex-1 truncate">{script.title}</span>
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 touch-manipulation" onClick={() => handleCopyMessage(script.content)} title="Copiar script">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 touch-manipulation" onClick={() => handleWhatsApp(script.content)} title="Enviar via WhatsApp">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRÓXIMO PASSO */}
      {guidance?.nextStage && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3 flex-shrink-0" />
          <span>Após resposta → <strong className="text-foreground">{ACENDER_STAGES.find(s => s.value === guidance.nextStage)?.label}</strong></span>
        </div>
      )}

      {/* AI Quick Coach Tip */}
      <QuickCoachTip lead={lead} />

      {/* Action buttons - mobile optimized */}
      <div className="flex items-center gap-1.5 mt-2">
        <Button className="btn-whatsapp flex-1 gap-1.5 h-10 text-sm" onClick={() => handleWhatsApp()}>
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button className="btn-call h-10 w-10 p-0" onClick={handleCall}>
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="secondary" className="h-10 w-10 p-0" onClick={() => onMarkDone?.(lead.id)}>
          <CheckCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => onReschedule?.(lead.id)}>
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
