import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockTracks } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, Phone, Calendar, FileText } from 'lucide-react';

const Trilhas = () => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP': return MessageCircle;
      case 'LIGACAO': return Phone;
      case 'REUNIAO': return Calendar;
      default: return FileText;
    }
  };

  return (
    <DashboardLayout 
      title="Trilhas de Nutrição" 
      subtitle={`${mockTracks.length} trilhas disponíveis`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {mockTracks.map(track => (
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
                  {track.leadType === 'DISTRIBUIDOR' ? 'Canal' : 'Direto'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {track.steps.map((step, index) => {
                  const Icon = getActionIcon(step.actionType);
                  return (
                    <AccordionItem key={index} value={`step-${index}`}>
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">D{step.day}</span>
                          </div>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-left">{step.actionType}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-11 space-y-2">
                          <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
                            {step.message}
                          </p>
                          {step.assetId && (
                            <Badge variant="secondary" className="text-xs">
                              📎 Asset: {step.assetId}
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
    </DashboardLayout>
  );
};

export default Trilhas;
