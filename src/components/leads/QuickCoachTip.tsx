import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSalesCoach, SalesCoachRecommendation } from '@/hooks/useSalesCoach';
import { EnrichedLead } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';

interface QuickCoachTipProps {
  lead: EnrichedLead;
}

export function QuickCoachTip({ lead }: QuickCoachTipProps) {
  const [recommendations, setRecommendations] = useState<SalesCoachRecommendation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const salesCoach = useSalesCoach();

  const handleGetTip = async () => {
    if (recommendations) {
      setIsOpen(!isOpen);
      return;
    }

    try {
      const result = await salesCoach.mutateAsync(lead);
      setRecommendations(result);
      setIsOpen(true);
    } catch (error) {
      toast.error('Erro ao obter sugestões');
    }
  };

  const copyScript = () => {
    if (recommendations?.script?.opening) {
      navigator.clipboard.writeText(
        recommendations.script.opening.replace('{nome}', lead.name.split(' ')[0])
      );
      setCopied(true);
      toast.success('Script copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (salesCoach.isPending) {
    return (
      <div className="mt-2 p-2 bg-primary/5 rounded-lg animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Analisando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {!isOpen ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 text-primary hover:text-primary"
          onClick={handleGetTip}
        >
          <Sparkles className="h-3 w-3" />
          {recommendations ? 'Ver sugestão IA' : 'Sugestão IA'}
        </Button>
      ) : recommendations ? (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-medium">
                {recommendations.recommended_action?.type || 'Ação'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {recommendations.summary}
          </p>

          {recommendations.script?.opening && (
            <div className="bg-background/50 rounded p-2 relative">
              <p className="text-xs pr-6 leading-relaxed">
                {recommendations.script.opening.replace('{nome}', lead.name.split(' ')[0])}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5"
                onClick={copyScript}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}

          {recommendations.recommended_material?.code && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] h-5">
                📎 {recommendations.recommended_material.code}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {recommendations.recommended_material.name}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
