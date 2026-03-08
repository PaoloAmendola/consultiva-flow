import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search, ChevronRight, Check, Circle, MessageCircle, Phone, 
  Copy, Package, Clock, Star, ChevronDown, ChevronUp, 
  CalendarDays, AlertCircle, Gift, Users, Camera, ShoppingCart
} from 'lucide-react';
import { useClientLeads, useUpdateLead, type EnrichedLead } from '@/hooks/useLeads';
import { useInteractions } from '@/hooks/useInteractions';
import { RECORRENCIA_SUBSTAGES, ORIGIN_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientesDashboard } from '@/components/clientes/ClientesDashboard';
import { useClientNotifications } from '@/hooks/useClientNotifications';
import { OrdersPanel } from '@/components/clientes/OrdersPanel';
import { SubstageFunnelChart } from '@/components/clientes/SubstageFunnelChart';
import { OrdersEvolutionChart } from '@/components/clientes/OrdersEvolutionChart';

// Guidance for each post-sale substage
const SUBSTAGE_GUIDANCE: Record<string, {
  icon: React.ElementType;
  color: string;
  goal: string;
  scripts: string[];
  whatToDo: string[];
  tips: string;
}> = {
  'D+2': {
    icon: Package,
    color: 'text-blue-500',
    goal: 'Confirmar recebimento e oferecer suporte técnico inicial',
    scripts: [
      'Oi {nome}! Tudo bem? Seu pedido já chegou? Quero garantir que está tudo certinho! 📦',
      '{nome}, passando pra saber se recebeu os produtos! Qualquer dúvida de uso, estou aqui pra te ajudar 💁‍♀️',
    ],
    whatToDo: ['Confirmar entrega', 'Enviar guia de uso', 'Tirar dúvidas técnicas', 'Verificar se chegou tudo certo'],
    tips: 'Contato rápido e acolhedor. Mostre que se importa com a experiência.',
  },
  'D+7': {
    icon: Star,
    color: 'text-yellow-500',
    goal: 'Verificar primeiros resultados e coletar feedback inicial',
    scripts: [
      'Oi {nome}! Já faz uma semana que você começou a usar! Como estão os resultados? 🌟',
      '{nome}, quero saber: já usou os produtos nos clientes? O que acharam? Me conta! 💇‍♀️',
    ],
    whatToDo: ['Perguntar sobre resultados', 'Coletar feedback', 'Enviar dicas avançadas de uso', 'Sugerir combinações de produtos'],
    tips: 'Foque nos resultados reais. Se houve problema, resolva imediatamente.',
  },
  'D+15': {
    icon: AlertCircle,
    color: 'text-emerald-500',
    goal: 'Check de satisfação e prevenção de churn',
    scripts: [
      'Oi {nome}! Passando pra um check rápido — de 0 a 10, quão satisfeita você está com os produtos? 🎯',
      '{nome}, já faz 15 dias! Quero entender como está sua experiência. Algo que possamos melhorar?',
    ],
    whatToDo: ['Aplicar NPS informal', 'Resolver pendências', 'Reforçar valor dos produtos', 'Identificar riscos de churn'],
    tips: 'Se a nota for < 7, acione imediatamente para entender e resolver.',
  },
  'D+30': {
    icon: ShoppingCart,
    color: 'text-orange-500',
    goal: 'Alerta de reposição e primeira recompra',
    scripts: [
      'Oi {nome}! Já faz 1 mês! Seus produtos devem estar acabando — quer que eu prepare um pedido de reposição? 🔄',
      '{nome}, hora de repor o estoque! Preparei uma sugestão baseada no seu último pedido. Quer ver? 📋',
    ],
    whatToDo: ['Sugerir reposição', 'Oferecer condição especial', 'Recomendar produtos complementares', 'Enviar catálogo atualizado'],
    tips: 'Momento chave! A reposição é o indicador #1 de fidelização.',
  },
  'D+45': {
    icon: Users,
    color: 'text-purple-500',
    goal: 'Engajamento comunitário e senso de pertencimento',
    scripts: [
      'Oi {nome}! Tenho um convite especial: nosso grupo exclusivo de profissionais! Lá compartilhamos dicas, lançamentos e muito mais 💫',
      '{nome}, você sabia que temos uma comunidade VIP? Posso te adicionar? É gratuito e exclusivo pra clientes! 🎉',
    ],
    whatToDo: ['Convidar para grupo VIP', 'Compartilhar conteúdo exclusivo', 'Apresentar a outros profissionais', 'Enviar preview de lançamentos'],
    tips: 'Comunidade gera retenção. Cliente que participa tem 3x mais chances de recomprar.',
  },
  'D+60': {
    icon: Camera,
    color: 'text-pink-500',
    goal: 'Coleta de depoimento e prova social',
    scripts: [
      'Oi {nome}! Seus resultados estão incríveis! Posso usar seu depoimento para inspirar outros profissionais? 📸',
      '{nome}, adoraria que você gravasse um vídeo curto contando sua experiência. Pode ser pelo WhatsApp mesmo! 🎥',
    ],
    whatToDo: ['Solicitar depoimento em texto', 'Pedir vídeo de resultados', 'Coletar fotos antes/depois', 'Oferecer benefício em troca'],
    tips: 'Depoimentos vendem mais que qualquer propaganda. Ofereça desconto ou brinde.',
  },
  'D+90': {
    icon: Gift,
    color: 'text-red-500',
    goal: 'Cross-sell, upsell e expansão de portfólio',
    scripts: [
      'Oi {nome}! Tenho novidades que combinam perfeitamente com o que você já usa. Posso te mostrar? 🎁',
      '{nome}, baseado nos seus resultados, separei uma linha complementar que vai turbinar ainda mais. Quer conhecer? 🚀',
    ],
    whatToDo: ['Apresentar novos produtos', 'Sugerir upgrade de linha', 'Oferecer kit especial', 'Propor parceria/revenda'],
    tips: 'Cliente satisfeito é a melhor oportunidade de crescimento. Personalize a oferta!',
  },
};

const Clientes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubstage, setActiveSubstage] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { data: clients, isLoading, error } = useClientLeads();
  const updateLead = useUpdateLead();
  useClientNotifications(clients);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      if (activeSubstage && (c.substatus || 'D+2') !== activeSubstage) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.company?.toLowerCase().includes(q);
    });
  }, [clients, searchQuery, activeSubstage]);

  const substageStats = useMemo(() => {
    if (!clients) return {};
    const stats: Record<string, number> = {};
    clients.forEach(c => {
      const sub = c.substatus || 'D+2';
      stats[sub] = (stats[sub] || 0) + 1;
    });
    return stats;
  }, [clients]);

  const getSubstageIndex = (substatus: string | null) => {
    const idx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === (substatus || 'D+2'));
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceSubstage = async (client: EnrichedLead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = getSubstageIndex(client.substatus);
    if (currentIdx >= RECORRENCIA_SUBSTAGES.length - 1) return;
    const next = RECORRENCIA_SUBSTAGES[currentIdx + 1];
    await updateLead.mutateAsync({ id: client.id, data: { substatus: next.value } });
  };

  const handleWhatsApp = (client: EnrichedLead, script?: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const phone = client.phone.replace(/\D/g, '');
    const message = script 
      ? encodeURIComponent(script.replace('{nome}', client.name.split(' ')[0]))
      : '';
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handleCall = (client: EnrichedLead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`tel:+55${client.phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleCopyScript = (script: string, clientName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(script.replace('{nome}', clientName.split(' ')[0]));
    toast.success('Script copiado!');
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedClient(expandedClient === id ? null : id);
  };

  const getDaysSinceConversion = (updatedAt: string) => {
    return differenceInDays(new Date(), new Date(updatedAt));
  };

  if (error) {
    return (
      <DashboardLayout title="Clientes" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar clientes. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Clientes"
      subtitle={isLoading ? 'Carregando...' : `${filteredClients.length} clientes em acompanhamento`}
    >
      {/* Dashboard metrics */}
      {!isLoading && clients && clients.length > 0 && (
        <>
          <ClientesDashboard clients={clients} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SubstageFunnelChart clients={clients} />
            <OrdersEvolutionChart />
          </div>
        </>
      )}

      {/* Search */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary h-10"
          />
        </div>

        {/* Substage filter pills with counts */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveSubstage(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-1',
              !activeSubstage ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            Todos
            <span className="opacity-70">({clients?.length || 0})</span>
          </button>
          {RECORRENCIA_SUBSTAGES.map(sub => {
            const count = substageStats[sub.value] || 0;
            const SubIcon = SUBSTAGE_GUIDANCE[sub.value]?.icon || Circle;
            return (
              <button
                key={sub.value}
                onClick={() => setActiveSubstage(activeSubstage === sub.value ? null : sub.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-1',
                  activeSubstage === sub.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                <SubIcon className="h-3 w-3" />
                {sub.value}
                {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active substage guidance banner */}
      {activeSubstage && SUBSTAGE_GUIDANCE[activeSubstage] && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              {(() => {
                const GIcon = SUBSTAGE_GUIDANCE[activeSubstage].icon;
                return <GIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', SUBSTAGE_GUIDANCE[activeSubstage].color)} />;
              })()}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {activeSubstage} — {RECORRENCIA_SUBSTAGES.find(s => s.value === activeSubstage)?.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {SUBSTAGE_GUIDANCE[activeSubstage].goal}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  💡 {SUBSTAGE_GUIDANCE[activeSubstage].tips}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client list */}
      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Leads convertidos aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          filteredClients.map(client => {
            const currentSubIdx = getSubstageIndex(client.substatus);
            const currentSub = RECORRENCIA_SUBSTAGES[currentSubIdx];
            const canAdvance = currentSubIdx < RECORRENCIA_SUBSTAGES.length - 1;
            const isExpanded = expandedClient === client.id;
            const guidance = SUBSTAGE_GUIDANCE[currentSub?.value || 'D+2'];
            const daysSince = getDaysSinceConversion(client.updated_at);
            const GuidanceIcon = guidance?.icon || Circle;
            const daysSinceUpdate = differenceInDays(new Date(), new Date(client.updated_at));
            const isChurnRisk = daysSinceUpdate > 14 && currentSubIdx <= 1;
            const isStale = daysSinceUpdate > 14 && !isChurnRisk;

            return (
              <div key={client.id} className={cn(
                'rounded-xl bg-card border overflow-hidden transition-colors',
                isChurnRisk ? 'border-destructive/60 ring-1 ring-destructive/20' : isStale ? 'border-warning/40' : 'border-border'
              )}>
                {/* Main card row */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', 
                      currentSubIdx < 3 ? 'bg-blue-500/10' : currentSubIdx < 5 ? 'bg-orange-500/10' : 'bg-emerald-500/10'
                    )}>
                      <GuidanceIcon className={cn('h-4 w-4', guidance?.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/leads/${client.id}`} className="font-semibold text-foreground text-sm truncate block hover:text-primary transition-colors">
                        {client.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{ORIGIN_LABELS[client.origin]}</span>
                        {client.company && <span>· {client.company}</span>}
                        <span>· {daysSince}d como cliente</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600"
                        onClick={(e) => handleWhatsApp(client, guidance?.scripts[0], e)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleCall(client, e)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      {canAdvance && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => handleAdvanceSubstage(client, e)}
                        >
                          Avançar
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mini timeline */}
                  <div className="flex items-center gap-0.5 mb-2 overflow-x-auto scrollbar-hide">
                    {RECORRENCIA_SUBSTAGES.map((sub, idx) => {
                      const isCompleted = idx < currentSubIdx;
                      const isCurrent = idx === currentSubIdx;
                      return (
                        <div key={sub.value} className="flex items-center flex-shrink-0">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors',
                            isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                            isCurrent && 'border-primary text-primary bg-primary/10',
                            !isCompleted && !isCurrent && 'border-border text-muted-foreground bg-muted',
                          )}>
                            {isCompleted ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                          </div>
                          {idx < RECORRENCIA_SUBSTAGES.length - 1 && (
                            <div className={cn(
                              'w-3 h-0.5',
                              idx < currentSubIdx ? 'bg-emerald-500' : 'bg-border'
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Current stage badge + expand */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {currentSub?.value} · {currentSub?.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">
                        {guidance?.goal}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-0.5 text-muted-foreground"
                      onClick={(e) => toggleExpand(client.id, e)}
                    >
                      {isExpanded ? 'Menos' : 'Guia'}
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded guidance panel */}
                {isExpanded && guidance && (
                  <div className="border-t border-border bg-muted/30 p-3 space-y-3">
                    {/* What to do */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        O que fazer agora
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {guidance.whatToDo.map((item, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Scripts */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Scripts prontos
                      </p>
                      <div className="space-y-2">
                        {guidance.scripts.map((script, i) => {
                          const personalizedScript = script.replace('{nome}', client.name.split(' ')[0]);
                          return (
                            <div key={i} className="bg-card rounded-lg p-2.5 border border-border text-xs relative group">
                              <p className="pr-16">{personalizedScript}</p>
                              <div className="absolute top-1.5 right-1.5 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => handleCopyScript(script, client.name, e)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-emerald-600"
                                  onClick={(e) => handleWhatsApp(client, script, e)}
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="bg-primary/5 rounded-lg p-2 border border-primary/20">
                      <p className="text-[10px] text-muted-foreground">
                        💡 <span className="font-medium">Dica:</span> {guidance.tips}
                      </p>
                    </div>

                    {/* Orders panel */}
                    <OrdersPanel leadId={client.id} clientName={client.name} />

                    {/* Quick link to full profile */}
                    <Link
                      to={`/leads/${client.id}`}
                      className="flex items-center justify-center gap-1 text-xs text-primary hover:underline py-1"
                    >
                      Ver perfil completo
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
