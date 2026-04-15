import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useGerencialData } from '@/hooks/useGerencialData';
import { useAiAnalytics } from '@/hooks/useAiAnalytics';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, Clock, Users, AlertTriangle,
  Target, MessageCircle, Sparkles, CheckCircle, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACENDER_STAGES, getStageLabel } from '@/types/database';
import { useNavigate } from 'react-router-dom';

const Gerencial = () => {
  const { data, isLoading, error, refetch } = useGerencialData();
  const { data: aiEvents } = useAiAnalytics();
  const navigate = useNavigate();

  if (error) {
    return (
      <DashboardLayout title="Gerencial" subtitle="Erro ao carregar">
        <ErrorState onRetry={() => refetch()} />
      </DashboardLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <DashboardLayout title="Gerencial" subtitle="Carregando...">
        <LoadingSkeleton variant="card" count={4} />
      </DashboardLayout>
    );
  }

  const { summary, stageBottlenecks, channelMetrics, leadAging, segmentPerformance } = data;

  // AI Analytics summary
  const aiShown = aiEvents?.filter((e: any) => e.event_type === 'shown').length || 0;
  const aiAccepted = aiEvents?.filter((e: any) => e.event_type === 'accepted').length || 0;
  const aiIgnored = aiEvents?.filter((e: any) => e.event_type === 'ignored').length || 0;
  const aiAcceptRate = aiShown > 0 ? Math.round((aiAccepted / aiShown) * 100) : 0;

  return (
    <DashboardLayout title="Gerencial" subtitle={`${summary.totalLeads} leads • ${summary.overallConversion}% conversão`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4 mb-4">
        <SummaryCard icon={<Users className="h-5 w-5" />} label="Ativos" value={summary.totalActive} variant="info" />
        <SummaryCard icon={<CheckCircle className="h-5 w-5" />} label="Convertidos" value={summary.totalConverted} variant="success" />
        <SummaryCard icon={<XCircle className="h-5 w-5" />} label="Perdidos" value={summary.totalLost} variant="muted" />
        <SummaryCard icon={<Target className="h-5 w-5" />} label="Conversão" value={`${summary.overallConversion}%`} variant="primary" />
        <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="Atrasados" value={summary.totalOverdue} variant={summary.totalOverdue > 0 ? 'danger' : 'muted'} />
      </div>

      <Tabs defaultValue="bottlenecks" className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="bottlenecks" className="flex-1 min-w-0 text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1 shrink-0" />
            <span className="truncate">Funil</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex-1 min-w-0 text-xs">
            <MessageCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
            <span className="truncate">Canais</span>
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex-1 min-w-0 text-xs">
            <Clock className="h-3.5 w-3.5 mr-1 shrink-0" />
            <span className="truncate">Aging</span>
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex-1 min-w-0 text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1 shrink-0" />
            <span className="truncate">Segmentos</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 min-w-0 text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1 shrink-0" />
            <span className="truncate">IA</span>
          </TabsTrigger>
        </TabsList>

        {/* Bottlenecks */}
        <TabsContent value="bottlenecks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Gargalos por Etapa ACENDER®
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stageBottlenecks.map(b => {
                const maxCount = Math.max(...stageBottlenecks.map(s => s.count), 1);
                return (
                  <div key={b.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', b.color)} />
                        <span className="font-medium">{b.label}</span>
                        {b.overdueCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1">
                            {b.overdueCount} atrasado{b.overdueCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{b.count} leads</span>
                        <span>~{b.avgDaysInStage}d</span>
                      </div>
                    </div>
                    <Progress value={(b.count / maxCount) * 100} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels */}
        <TabsContent value="channels">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Taxa de Resposta por Canal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelMetrics.filter(c => c.totalSent > 0 || c.totalReceived > 0).map(c => (
                  <div key={c.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.label}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{c.totalSent} enviadas</span>
                        <span className="text-muted-foreground">{c.totalReceived} recebidas</span>
                        <Badge variant={c.responseRate >= 50 ? 'default' : 'secondary'} className="text-[10px]">
                          {c.responseRate}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={c.responseRate} className="h-2" />
                  </div>
                ))}
                {channelMetrics.every(c => c.totalSent === 0 && c.totalReceived === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem interações registradas ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging */}
        <TabsContent value="aging">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Lead Aging — Inativos há mais tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leadAging.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead ativo</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Lead</TableHead>
                        <TableHead className="text-xs">Etapa</TableHead>
                        <TableHead className="text-xs text-right">Sem contato</TableHead>
                        <TableHead className="text-xs text-right">Prioridade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadAging.map(l => (
                        <TableRow
                          key={l.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/leads/${l.id}`)}
                        >
                          <TableCell className="text-sm font-medium py-2">{l.name}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-[10px]">
                              {getStageLabel(l.stage)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <span className={cn(
                              'text-sm font-medium',
                              l.lastTouchDays > 7 ? 'text-destructive' : l.lastTouchDays > 3 ? 'text-warning' : 'text-foreground'
                            )}>
                              {l.lastTouchDays}d
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Badge variant="secondary" className="text-[10px]">{l.priority}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments */}
        <TabsContent value="segments">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance por Segmento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Segmento</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs text-right">Convertidos</TableHead>
                      <TableHead className="text-xs text-right">Conversão</TableHead>
                      <TableHead className="text-xs text-right">Ciclo Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentPerformance.filter(s => s.totalLeads > 0).map(s => (
                      <TableRow key={s.segment}>
                        <TableCell className="text-sm font-medium py-2">{s.label}</TableCell>
                        <TableCell className="text-right py-2 text-sm">{s.totalLeads}</TableCell>
                        <TableCell className="text-right py-2 text-sm">{s.convertedLeads}</TableCell>
                        <TableCell className="text-right py-2">
                          <Badge variant={s.conversionRate >= 30 ? 'default' : 'secondary'} className="text-[10px]">
                            {s.conversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2 text-sm text-muted-foreground">
                          {s.avgCycleDays > 0 ? `${s.avgCycleDays}d` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analytics */}
        <TabsContent value="ai">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Analytics da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{aiShown}</p>
                  <p className="text-xs text-muted-foreground">Sugestões Exibidas</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-2xl font-bold text-success">{aiAccepted}</p>
                  <p className="text-xs text-muted-foreground">Aceitas</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <p className="text-2xl font-bold text-warning">{aiIgnored}</p>
                  <p className="text-xs text-muted-foreground">Ignoradas</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{aiAcceptRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa de Aceitação</p>
                </div>
              </div>

              {(!aiEvents || aiEvents.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Os analytics da IA serão exibidos aqui conforme o assistente for utilizado nos leads.
                </p>
              )}

              {aiEvents && aiEvents.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {aiEvents.slice(0, 15).map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          event.event_type === 'accepted' ? 'default' :
                          event.event_type === 'ignored' ? 'secondary' : 'outline'
                        } className="text-[10px]">
                          {event.event_type === 'shown' ? 'Exibida' :
                           event.event_type === 'accepted' ? 'Aceita' :
                           event.event_type === 'ignored' ? 'Ignorada' : 'Ação'}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-48">
                          {event.recommendation_summary || event.suggested_action || '—'}
                        </span>
                      </div>
                      {event.suggested_channel && event.actual_channel && event.suggested_channel !== event.actual_channel && (
                        <span className="text-[10px] text-warning">
                          {event.suggested_channel} → {event.actual_channel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

function SummaryCard({ icon, label, value, variant }: {
  icon: React.ReactNode; label: string; value: number | string;
  variant: 'info' | 'success' | 'danger' | 'muted' | 'primary';
}) {
  const styles = {
    info: 'bg-info/10 text-info',
    success: 'bg-success/10 text-success',
    danger: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', styles[variant])}>{icon}</div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Gerencial;
