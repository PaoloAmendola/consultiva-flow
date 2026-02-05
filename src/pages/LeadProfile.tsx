import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  Building2, 
  MapPin,
  Clock,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  Plus,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useLead, useUpdateLead } from '@/hooks/useLeads';
import { useInteractions, useCreateInteraction } from '@/hooks/useInteractions';
import { useTasks } from '@/hooks/useTasks';
import { useNurtureTracks } from '@/hooks/useNurtureTracks';
import { 
  PROFISSIONAL_STAGES, 
  DISTRIBUIDOR_STAGES, 
  ORIGIN_LABELS,
  ACTION_TYPE_CONFIG,
  PRIORITY_CONFIG,
} from '@/types/database';
import { EditLeadModal } from '@/components/leads/EditLeadModal';
import { AddInteractionModal } from '@/components/leads/AddInteractionModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskList } from '@/components/tasks/TaskList';
import { SalesCoachCard } from '@/components/leads/SalesCoachCard';

const LeadProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  
  const { data: lead, isLoading: leadLoading } = useLead(id || '');
  const { data: interactions, isLoading: interactionsLoading } = useInteractions(id || '');
  const { data: tasks } = useTasks({ leadId: id || '' });
  const { data: tracks } = useNurtureTracks();
  const updateLead = useUpdateLead();
  const createInteraction = useCreateInteraction();

  if (leadLoading) {
    return (
      <DashboardLayout title="Carregando..." subtitle="">
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead não encontrado" subtitle="">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Este lead não existe ou foi removido.</p>
          <Button onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stages = lead.lead_type === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
  const currentStage = stages.find(s => s.value === lead.stage);
  const nurtureTrack = tracks?.find(t => t.id === lead.nurture_track_id);
  const currentNurtureStep = nurtureTrack?.steps[lead.nurture_step || 0];

  const getInteractionIcon = (type: string) => {
    if (type.includes('WHATSAPP')) return MessageCircle;
    if (type.includes('LIGACAO')) return Phone;
    if (type.includes('EMAIL')) return Mail;
    if (type === 'REUNIAO') return Calendar;
    return FileText;
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

  const handleCopyMessage = () => {
    if (lead.suggestedMessage) {
      const message = lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0]);
      navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada!');
    }
  };

  const handleSendNurture = async () => {
    if (!currentNurtureStep) return;

    const message = currentNurtureStep.message.replace('{nome}', lead.name.split(' ')[0]);
    
    await createInteraction.mutateAsync({
      lead_id: lead.id,
      type: 'WHATSAPP_OUT',
      direction: 'OUT',
      content: message,
      asset_sent: currentNurtureStep.asset_id || null,
    });

    // Advance nurture step
    const nextStep = (lead.nurture_step || 0) + 1;
    const nextStepData = nurtureTrack?.steps[nextStep];
    
    if (nextStepData) {
      const nextActionDate = new Date();
      nextActionDate.setDate(nextActionDate.getDate() + (nextStepData.day - currentNurtureStep.day));
      
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          nurture_step: nextStep,
          next_action_at: nextActionDate.toISOString(),
          next_action_type: nextStepData.action_type,
        },
      });
    }

    handleWhatsApp();
    toast.success('Mensagem de nutrição enviada!');
  };

  return (
    <DashboardLayout 
      title={lead.name} 
      subtitle={`${ORIGIN_LABELS[lead.origin]} • ${lead.company || 'Sem empresa'}`}
    >
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead info card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{lead.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={cn(currentStage?.color)}>
                      {currentStage?.label || lead.stage}
                    </Badge>
                    <Badge variant="outline">
                      {lead.lead_type === 'DISTRIBUIDOR' ? 'Canal' : 'Direto'}
                    </Badge>
                    <Badge variant="outline" className={PRIORITY_CONFIG[lead.priority]?.color}>
                      {lead.priority}
                    </Badge>
                    {lead.score && (
                      <Badge variant="secondary">Score: {lead.score}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" className="bg-green-600 hover:bg-green-700" onClick={handleWhatsApp}>
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700" onClick={handleCall}>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setInteractionModalOpen(true)}>
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setEditModalOpen(true)}>
                    <Edit className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.company}</span>
                  </div>
                )}
                {(lead.city || lead.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {lead.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {lead.observations && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{lead.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interaction history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : interactions && interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map(interaction => {
                    const Icon = getInteractionIcon(interaction.type);
                    return (
                      <div 
                        key={interaction.id}
                        className={cn(
                          'flex gap-3 p-3 rounded-lg',
                          interaction.direction === 'IN' ? 'bg-secondary/50' : 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          interaction.direction === 'IN' ? 'bg-secondary' : 'bg-primary/20'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {interaction.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(interaction.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {interaction.content && (
                            <p className="text-sm">{interaction.content}</p>
                          )}
                          {interaction.asset_sent && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              📎 {interaction.asset_sent}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma interação registrada
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Sales Coach */}
          <SalesCoachCard lead={lead} />

          {/* Next action card */}
          <Card className={cn(lead.isOverdue && 'border-destructive')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próxima Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.isOverdue && lead.overdueReason && (
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{lead.overdueReason}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Tipo</p>
                <p className="font-medium">
                  {ACTION_TYPE_CONFIG[lead.next_action_type]?.label || lead.next_action_type}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Quando</p>
                <p className="font-medium">
                  {format(new Date(lead.next_action_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {lead.next_action_note && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">O que fazer</p>
                  <p className="text-sm">{lead.next_action_note}</p>
                </div>
              )}

              {lead.suggestedMessage && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">O que falar</p>
                  <div className="bg-secondary/50 rounded-lg p-3 relative">
                    <p className="text-sm pr-8">
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
            </CardContent>
          </Card>

          {/* Tasks section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tarefas</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TaskList 
                tasks={tasks || []} 
                showLeadName={false}
              />
            </CardContent>
          </Card>

          {/* Nurture track card */}
          {nurtureTrack && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trilha de Nutrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{nurtureTrack.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Etapa {(lead.nurture_step || 0) + 1} de {nurtureTrack.steps.length}
                  </p>
                </div>

                {/* Progress */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${((lead.nurture_step || 0) + 1) / nurtureTrack.steps.length * 100}%` }}
                  />
                </div>

                {currentNurtureStep && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Mensagem D{currentNurtureStep.day}</p>
                      <p className="text-sm bg-secondary/50 rounded-lg p-3">
                        {currentNurtureStep.message.replace('{nome}', lead.name.split(' ')[0])}
                      </p>
                    </div>

                    {currentNurtureStep.asset_id && (
                      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm flex-1">Asset: {currentNurtureStep.asset_id}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}

                    <Button 
                      className="w-full gap-2" 
                      onClick={handleSendNurture}
                      disabled={createInteraction.isPending}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {createInteraction.isPending ? 'Enviando...' : 'Enviar e Avançar'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditLeadModal 
        lead={lead}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />

      <AddInteractionModal 
        leadId={lead.id}
        open={interactionModalOpen}
        onOpenChange={setInteractionModalOpen}
      />

      <CreateTaskModal 
        leadId={lead.id}
        leadName={lead.name}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
      />
    </DashboardLayout>
  );
};

export default LeadProfile;
