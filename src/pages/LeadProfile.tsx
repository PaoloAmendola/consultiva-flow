import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockLeads, mockInteractions, mockTracks, mockAssets } from '@/data/mockData';
import { ORIGIN_LABELS, PROFISSIONAL_STAGES, DISTRIBUIDOR_STAGES, ACTION_TYPES } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Calendar,
  Clock,
  Edit,
  Send,
  ChevronRight,
  FileText,
  Play,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const LeadProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const lead = mockLeads.find(l => l.id === id);
  const interactions = mockInteractions.filter(i => i.leadId === id);
  const nurtureTrack = lead?.nurtureTrackId 
    ? mockTracks.find(t => t.id === lead.nurtureTrackId) 
    : null;
  const currentNurtureStep = nurtureTrack?.steps[lead?.nurtureStep || 0];
  const suggestedAsset = currentNurtureStep?.assetId 
    ? mockAssets.find(a => a.id === currentNurtureStep.assetId)
    : null;

  if (!lead) {
    return (
      <AppLayout title="Lead não encontrado">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Lead não encontrado</p>
          <Button onClick={() => navigate('/leads')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const stages = lead.leadType === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
  const currentStage = stages.find(s => s.value === lead.stage);
  const actionType = ACTION_TYPES.find(a => a.value === lead.nextActionType);

  const handleSendNurture = () => {
    toast.success('Mensagem de nutrição enviada!');
  };

  const handleNextStep = () => {
    toast.success('Avançou para próximo passo da trilha');
  };

  const handleChangeTrack = () => {
    toast.info('Em breve: Mudar trilha');
  };

  const getInteractionIcon = (type: string) => {
    if (type.includes('WHATSAPP')) return MessageCircle;
    if (type.includes('LIGACAO')) return Phone;
    if (type.includes('EMAIL')) return Mail;
    if (type.includes('REUNIAO')) return Calendar;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{lead.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStage?.label}
              </Badge>
              <Badge variant="outline" className={cn(
                'text-xs',
                lead.priority === 'P1' && 'border-destructive text-destructive',
                lead.priority === 'P2' && 'border-warning text-warning',
              )}>
                {lead.priority}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Contact info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
              <Button variant="ghost" size="icon" className="btn-whatsapp h-10 w-10">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="btn-call h-10 w-10">
                <Phone className="h-5 w-5" />
              </Button>
            </div>

            {lead.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{lead.email}</p>
                </div>
              </div>
            )}

            {lead.company && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{lead.company}</p>
                </div>
              </div>
            )}

            {(lead.city || lead.state) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium">{[lead.city, lead.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {lead.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Action */}
        <Card className={cn(
          'border-l-4',
          lead.isOverdue ? 'border-l-destructive' : 'border-l-primary'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PRÓXIMA AÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                lead.isOverdue ? 'bg-destructive/20' : 'bg-primary/20'
              )}>
                <Clock className={cn(
                  'h-6 w-6',
                  lead.isOverdue ? 'text-destructive' : 'text-primary'
                )} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{actionType?.label || lead.nextActionType}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(lead.nextActionAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {lead.nextActionNote && (
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
                {lead.nextActionNote}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Nurture Section */}
        {nurtureTrack && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>NUTRIÇÃO</span>
                <Badge variant="outline" className="text-xs">
                  {nurtureTrack.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${((lead.nurtureStep || 0) / nurtureTrack.steps.length) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Passo {(lead.nurtureStep || 0) + 1}/{nurtureTrack.steps.length}
                </span>
              </div>

              {currentNurtureStep && (
                <>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      D{currentNurtureStep.day} - Mensagem sugerida:
                    </p>
                    <p className="text-sm text-foreground">
                      {currentNurtureStep.message.replace('{nome}', lead.name.split(' ')[0])}
                    </p>
                  </div>

                  {suggestedAsset && (
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="flex-1 text-sm">{suggestedAsset.name}</span>
                      <Button variant="ghost" size="sm">
                        Abrir
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1 btn-primary gap-2" onClick={handleSendNurture}>
                      <Send className="h-4 w-4" />
                      Enviar agora
                    </Button>
                    <Button variant="secondary" onClick={handleNextStep}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={handleChangeTrack}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              HISTÓRICO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma interação registrada
                </p>
              ) : (
                interactions.map((interaction, index) => {
                  const Icon = getInteractionIcon(interaction.type);
                  return (
                    <div key={interaction.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          interaction.direction === 'IN' ? 'bg-info/20' : 'bg-secondary'
                        )}>
                          <Icon className={cn(
                            'h-4 w-4',
                            interaction.direction === 'IN' ? 'text-info' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {interaction.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(interaction.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {interaction.content && (
                            <p className="text-sm text-foreground">{interaction.content}</p>
                          )}
                          {interaction.assetSent && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              📎 {mockAssets.find(a => a.id === interaction.assetSent)?.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadProfile;
