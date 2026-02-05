import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle,
  Target,
  MessageSquare,
  FileText,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSalesCoach, SalesCoachRecommendation } from '@/hooks/useSalesCoach';
import { EnrichedLead } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';

interface SalesCoachCardProps {
  lead: EnrichedLead;
}

export function SalesCoachCard({ lead }: SalesCoachCardProps) {
  const [recommendations, setRecommendations] = useState<SalesCoachRecommendation | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const salesCoach = useSalesCoach();

  const handleGetRecommendations = async () => {
    try {
      const result = await salesCoach.mutateAsync(lead);
      setRecommendations(result);
    } catch (error) {
      toast.error('Erro ao obter sugestões do assistente');
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text.replace('{nome}', lead.name.split(' ')[0]));
    setCopiedField(field);
    toast.success('Copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const urgencyConfig = {
    alta: { color: 'bg-destructive/10 text-destructive', label: 'Urgência Alta' },
    media: { color: 'bg-warning/10 text-warning', label: 'Urgência Média' },
    baixa: { color: 'bg-success/10 text-success', label: 'Urgência Baixa' },
  };

  if (salesCoach.isPending) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            Analisando lead...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/60" />
          <h3 className="font-medium mb-1">Assistente de Vendas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Obtenha sugestões de ação, scripts e materiais personalizados
          </p>
          <Button onClick={handleGetRecommendations} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Obter Sugestões
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive/60" />
          <p className="text-sm text-destructive mb-4">{recommendations.error}</p>
          <Button variant="outline" onClick={handleGetRecommendations}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Assistente de Vendas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", urgencyConfig[recommendations.urgency]?.color)}>
              {urgencyConfig[recommendations.urgency]?.label}
            </Badge>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={handleGetRecommendations}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{recommendations.summary}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recommended Action */}
        {recommendations.recommended_action && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Ação Recomendada
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <Badge variant="outline" className="mb-2">
                {recommendations.recommended_action.type}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {recommendations.recommended_action.reason}
              </p>
            </div>
          </div>
        )}

        {/* Script */}
        {recommendations.script && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-primary" />
              Script de Abordagem
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">ABERTURA</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(recommendations.script!.opening, 'opening')}
                  >
                    {copiedField === 'opening' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm">{recommendations.script.opening}</p>
              </div>

              {recommendations.script.key_points?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">PONTOS CHAVE</span>
                  <ul className="mt-1 space-y-1">
                    {recommendations.script.key_points.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">FECHAMENTO</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(recommendations.script!.closing, 'closing')}
                  >
                    {copiedField === 'closing' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm">{recommendations.script.closing}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Material */}
        {recommendations.recommended_material?.code && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Material Sugerido
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <Badge variant="secondary">{recommendations.recommended_material.code}</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">{recommendations.recommended_material.name}</p>
                <p className="text-xs text-muted-foreground">{recommendations.recommended_material.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Strategic Tips */}
        {recommendations.strategic_tips && recommendations.strategic_tips.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-primary" />
              Dicas Estratégicas
            </div>
            <ul className="space-y-1">
              {recommendations.strategic_tips.map((tip, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                  <span className="text-warning">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Objections */}
        {recommendations.objections_to_expect && recommendations.objections_to_expect.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Objeções Prováveis
            </div>
            <ul className="space-y-1">
              {recommendations.objections_to_expect.map((objection, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                  <span>⚠️</span>
                  {objection}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {recommendations.next_steps && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="font-medium">Próximo passo:</span>
              <span className="text-muted-foreground">{recommendations.next_steps}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
