import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNurtureTracks } from '@/hooks/useNurtureTracks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Phone, Calendar, FileText } from 'lucide-react';
import { ACTION_TYPE_CONFIG } from '@/types/database';

const Trilhas = () => {
  const { data: tracks, isLoading, error } = useNurtureTracks();

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP': return MessageCircle;
      case 'LIGACAO': return Phone;
      case 'REUNIAO': return Calendar;
      default: return FileText;
    }
  };

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
      subtitle={isLoading ? 'Carregando...' : `${tracks?.length || 0} trilhas disponíveis`}
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {tracks.map(track => (
            <Card key={track.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{track.name}</CardTitle>
                    {track.description && (
                      <p className="text-sm text-muted-foreground mt-1">{track.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {track.lead_type === 'DISTRIBUIDOR' ? 'Canal' : 'Direto'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {track.steps.map((step, index) => {
                    const Icon = getActionIcon(step.action_type);
                    const actionLabel = ACTION_TYPE_CONFIG[step.action_type]?.label || step.action_type;
                    return (
                      <AccordionItem key={index} value={`step-${index}`}>
                        <AccordionTrigger className="text-sm hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">D{step.day}</span>
                            </div>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-left">{actionLabel}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-11 space-y-2">
                            <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
                              {step.message}
                            </p>
                            {step.asset_id && (
                              <Badge variant="secondary" className="text-xs">
                                📎 Asset: {step.asset_id}
                              </Badge>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
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
