import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNurtureTracks } from '@/hooks/useNurtureTracks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Phone, Calendar, FileText, Mail, ChevronDown, ChevronUp, Sparkles, Route, Send } from 'lucide-react';
import { ACTION_TYPE_CONFIG, LeadType } from '@/types/database';
import { cn } from '@/lib/utils';

const Trilhas = () => {
  const { data: tracks, isLoading, error } = useNurtureTracks();
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LeadType | null>(null);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP': return MessageCircle;
      case 'LIGACAO': return Phone;
      case 'REUNIAO': return Calendar;
      case 'EMAIL': return Mail;
      case 'ENVIAR_MATERIAL': return Send;
      default: return FileText;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'WHATSAPP': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'LIGACAO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REUNIAO': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'EMAIL': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const filteredTracks = (tracks || []).filter(t => !typeFilter || t.lead_type === typeFilter);

  if (error) {
    return (
      <DashboardLayout title="Trilhas de Nutrição" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar trilhas. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Trilhas de Nutrição" 
      subtitle={isLoading ? 'Carregando...' : `${filteredTracks.length} trilhas disponíveis`}
    >
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={typeFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter(null)}
        >
          Todas
        </Button>
        <Button
          variant={typeFilter === 'PROFISSIONAL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('PROFISSIONAL')}
          className="gap-1.5"
        >
          👤 Profissional
        </Button>
        <Button
          variant={typeFilter === 'DISTRIBUIDOR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTypeFilter('DISTRIBUIDOR')}
          className="gap-1.5"
        >
          🏢 Distribuidor
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredTracks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTracks.map(track => {
            const isExpanded = expandedTrack === track.id;
            const totalSteps = track.steps.length;
            const lastDay = track.steps[totalSteps - 1]?.day ?? 0;

            return (
              <Card 
                key={track.id} 
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  isExpanded && "ring-1 ring-primary/30"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{track.name}</CardTitle>
                      </div>
                      {track.description && (
                        <p className="text-sm text-muted-foreground">{track.description}</p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs shrink-0",
                        track.lead_type === 'DISTRIBUIDOR' 
                          ? 'border-blue-500/50 text-blue-400' 
                          : 'border-purple-500/50 text-purple-400'
                      )}
                    >
                      {track.lead_type === 'DISTRIBUIDOR' ? '🏢 Canal' : '👤 Direto'}
                    </Badge>
                  </div>

                  {/* Track stats */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Route className="h-3.5 w-3.5" />
                      <span>{totalSteps} passos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{lastDay} dias</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Step timeline preview */}
                  <div className="flex items-center gap-1 mb-3">
                    {track.steps.map((step, idx) => {
                      const Icon = getActionIcon(step.action_type);
                      return (
                        <div key={idx} className="flex items-center">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center border",
                            getActionColor(step.action_type)
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {idx < track.steps.length - 1 && (
                            <div className="w-3 h-px bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Expand/collapse */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Recolher passos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Ver todos os passos
                      </>
                    )}
                  </Button>

                  {/* Expanded steps */}
                  {isExpanded && (
                    <div className="mt-3 space-y-0 animate-fade-in">
                      {track.steps.map((step, index) => {
                        const Icon = getActionIcon(step.action_type);
                        const actionLabel = ACTION_TYPE_CONFIG[step.action_type]?.label || step.action_type;
                        const isLast = index === track.steps.length - 1;

                        return (
                          <div key={index} className="relative flex gap-3">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border z-10",
                                getActionColor(step.action_type)
                              )}>
                                <span className="text-[10px] font-bold">D{step.day}</span>
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 bg-border min-h-[16px]" />
                              )}
                            </div>

                            {/* Content */}
                            <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">{actionLabel}</span>
                              </div>
                              <div className="bg-secondary/60 rounded-lg p-3 text-sm text-foreground leading-relaxed">
                                {step.message}
                              </div>
                              {step.asset_id && (
                                <Badge variant="secondary" className="mt-2 text-xs gap-1">
                                  📎 {step.asset_id}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Route className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nenhuma trilha cadastrada
          </h3>
          <p className="text-sm text-muted-foreground">
            As trilhas de nutrição serão carregadas do banco de dados
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Trilhas;
