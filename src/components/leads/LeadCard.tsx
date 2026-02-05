import { 
  MessageCircle, 
  Phone, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EnrichedLead } from '@/hooks/useLeads';
import { 
  PROFISSIONAL_STAGES, 
  DISTRIBUIDOR_STAGES, 
  ORIGIN_LABELS,
  ACTION_TYPE_CONFIG 
} from '@/types/database';
import { QuickCoachTip } from './QuickCoachTip';

interface LeadCardProps {
  lead: EnrichedLead;
  onMarkDone?: (leadId: string) => void;
  onReschedule?: (leadId: string) => void;
}

export function LeadCard({ lead, onMarkDone, onReschedule }: LeadCardProps) {
  const stages = lead.lead_type === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
  const currentStage = stages.find(s => s.value === lead.stage);
  
  const priorityClass = lead.priority === 'P1' ? 'action-card-urgent' 
    : lead.priority === 'P2' ? 'action-card-warning' 
    : 'action-card-normal';

  const handleCopyMessage = () => {
    if (lead.suggestedMessage) {
      const message = lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0]);
      navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada!');
    }
  };

  const handleWhatsApp = () => {
    const phone = lead.phone.replace(/\D/g, '');
    const message = lead.suggestedMessage 
      ? encodeURIComponent(lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0]))
      : '';
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:+55${lead.phone.replace(/\D/g, '')}`, '_blank');
  };

  const actionLabel = ACTION_TYPE_CONFIG[lead.next_action_type]?.label || lead.next_action_type;

  return (
    <div className={cn('action-card', priorityClass, 'animate-fade-in')}>
      {/* Header: Name + Stage + Time */}
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
              className={cn('text-xs', currentStage?.color)}
            >
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
        <div className="flex flex-col items-end gap-1">
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
      </div>

      {/* Reason / Overdue info */}
      {lead.overdueReason && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10">
          <Clock className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive font-medium">{lead.overdueReason}</span>
        </div>
      )}

      {/* What to do */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          O que fazer
        </p>
        <p className="text-sm text-foreground font-medium">
          {lead.next_action_note || `${actionLabel}`}
        </p>
      </div>

      {/* What to say */}
      {lead.suggestedMessage && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            O que falar
          </p>
          <div className="bg-secondary/50 rounded-lg p-3 relative">
            <p className="text-sm text-foreground pr-8">
              {lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0])}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleCopyMessage}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* What to send (Asset) */}
      {lead.suggestedAssetCode && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            O que enviar
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

      {/* AI Quick Coach Tip */}
      <QuickCoachTip lead={lead} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button 
          className="btn-whatsapp flex-1 gap-2"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </Button>
        <Button 
          className="btn-call"
          onClick={handleCall}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button 
          variant="secondary"
          className="btn-secondary"
          onClick={() => onMarkDone?.(lead.id)}
        >
          <CheckCircle className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost"
          className="btn-ghost"
          onClick={() => onReschedule?.(lead.id)}
        >
          <Clock className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
