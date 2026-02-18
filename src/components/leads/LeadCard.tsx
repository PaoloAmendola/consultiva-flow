import { 
  MessageCircle, 
  Phone, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  FileText,
  Copy,
  ExternalLink,
  ScrollText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EnrichedLead } from '@/hooks/useLeads';
import { useScripts } from '@/hooks/useScripts';
import { 
  ACENDER_STAGES,
  ORIGIN_LABELS,
  ACTION_TYPE_CONFIG,
  STAGE_GUIDANCE,
  mapLegacyStage,
} from '@/types/database';
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
  
  const priorityClass = lead.priority === 'P1' ? 'action-card-urgent' 
    : lead.priority === 'P2' ? 'action-card-warning' 
    : 'action-card-normal';

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
    <div className={cn('action-card', priorityClass, 'animate-fade-in')}>
      {/* Header: Name + Stage + Priority */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/leads/${lead.id}`}
              className="text-base font-semibold text-foreground hover:text-primary transition-colors"
            >
              {lead.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className={cn('text-xs text-white', currentStage?.color)}
            >
              {currentStage?.letter} · {currentStage?.label || lead.stage}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {ORIGIN_LABELS[lead.origin]}
            </span>
            {lead.company && (
              <span className="text-xs text-muted-foreground">• {lead.company}</span>
            )}
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs font-bold',
            lead.priority === 'P1' && 'border-destructive text-destructive',
            lead.priority === 'P2' && 'border-warning text-warning',
            lead.priority === 'P3' && 'border-info text-info',
          )}
        >
          {lead.priority}
        </Badge>
      </div>

      {/* Overdue */}
      {lead.overdueReason && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10">
          <Clock className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive font-medium">{lead.overdueReason}</span>
        </div>
      )}

      {/* O QUE FAZER AGORA */}
      <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-xs text-primary uppercase tracking-wide font-semibold mb-1">
          🎯 O que fazer agora
        </p>
        <p className="text-sm text-foreground font-medium">
          {lead.next_action_note || guidance?.instruction || ACTION_TYPE_CONFIG[lead.next_action_type]?.label}
        </p>
        {guidance?.goal && (
          <p className="text-xs text-muted-foreground mt-1">
            Objetivo: {guidance.goal}
          </p>
        )}
      </div>

      {/* O QUE FALAR - suggested message */}
      {lead.suggestedMessage && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            💬 O que falar
          </p>
          <div className="bg-secondary/50 rounded-lg p-3 relative">
            <p className="text-sm text-foreground pr-8">
              {lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0])}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => handleCopyMessage()}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* O QUE ENVIAR */}
      {lead.suggestedAssetCode && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            📎 O que enviar
          </p>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground flex-1">Asset: {lead.suggestedAssetCode}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* SCRIPTS - collapsible */}
      {scripts && scripts.length > 0 && (
        <div className="mb-3">
          <button 
            onClick={() => setShowScripts(!showScripts)}
            className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wide mb-1 hover:text-foreground transition-colors"
          >
            <ScrollText className="h-3 w-3" />
            Scripts prontos ({scripts.length})
            <ChevronRight className={cn('h-3 w-3 transition-transform', showScripts && 'rotate-90')} />
          </button>
          {showScripts && (
            <div className="space-y-2 animate-fade-in">
              {scripts.slice(0, 4).map(script => (
                <div key={script.id} className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
                  <span className="text-xs text-foreground flex-1 truncate">{script.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopyMessage(script.content)}
                    title="Copiar script"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleWhatsApp(script.content)}
                    title="Enviar via WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRÓXIMO PASSO */}
      {guidance?.nextStage && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span>Após resposta → mover para <strong className="text-foreground">{ACENDER_STAGES.find(s => s.value === guidance.nextStage)?.label}</strong></span>
        </div>
      )}

      {/* AI Quick Coach Tip */}
      <QuickCoachTip lead={lead} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button className="btn-whatsapp flex-1 gap-2" onClick={() => handleWhatsApp()}>
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </Button>
        <Button className="btn-call" onClick={handleCall}>
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="secondary" className="btn-secondary" onClick={() => onMarkDone?.(lead.id)}>
          <CheckCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" className="btn-ghost" onClick={() => onReschedule?.(lead.id)}>
          <Clock className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
