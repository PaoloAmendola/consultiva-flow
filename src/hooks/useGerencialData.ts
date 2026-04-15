import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, differenceInHours } from 'date-fns';
import { ACENDER_STAGES } from '@/types/database';

const client = () => supabase as any;

export interface StageBottleneck {
  stage: string;
  label: string;
  count: number;
  avgDaysInStage: number;
  overdueCount: number;
  color: string;
}

export interface ChannelMetrics {
  channel: string;
  label: string;
  totalSent: number;
  totalReceived: number;
  responseRate: number;
}

export interface LeadAging {
  id: string;
  name: string;
  stage: string;
  daysWithoutAction: number;
  priority: string;
  lastTouchDays: number;
}

export interface SegmentPerformance {
  segment: string;
  label: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgCycleDays: number;
}

export function useGerencialData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gerencial', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch all data in parallel
      const [leadsRes, interactionsRes] = await Promise.all([
        client().from('leads').select('*').eq('user_id', user.id),
        client().from('interactions').select('*').eq('user_id', user.id),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (interactionsRes.error) throw interactionsRes.error;

      const leads = leadsRes.data || [];
      const interactions = interactionsRes.data || [];
      const now = new Date();

      // 1. Stage Bottlenecks
      const stageBottlenecks: StageBottleneck[] = ACENDER_STAGES.map(s => {
        const stageLeads = leads.filter((l: any) => l.stage === s.value && l.status_final === 'ATIVO');
        const avgDays = stageLeads.length > 0
          ? stageLeads.reduce((sum: number, l: any) => sum + differenceInDays(now, new Date(l.updated_at)), 0) / stageLeads.length
          : 0;
        const overdueCount = stageLeads.filter((l: any) => new Date(l.next_action_at) < now).length;

        return {
          stage: s.value,
          label: s.label,
          count: stageLeads.length,
          avgDaysInStage: Math.round(avgDays * 10) / 10,
          overdueCount,
          color: s.color,
        };
      });

      // 2. Channel Response Rates
      const channelMap: Record<string, { sent: number; received: number; label: string }> = {
        WHATSAPP: { sent: 0, received: 0, label: 'WhatsApp' },
        LIGACAO: { sent: 0, received: 0, label: 'Ligação' },
        EMAIL: { sent: 0, received: 0, label: 'Email' },
        VISITA: { sent: 0, received: 0, label: 'Visita' },
        REUNIAO: { sent: 0, received: 0, label: 'Reunião' },
      };

      interactions.forEach((i: any) => {
        const channel = i.type.replace(/_IN|_OUT/, '');
        if (channelMap[channel]) {
          if (i.direction === 'OUT') channelMap[channel].sent++;
          else channelMap[channel].received++;
        }
      });

      const channelMetrics: ChannelMetrics[] = Object.entries(channelMap).map(([channel, data]) => ({
        channel,
        label: data.label,
        totalSent: data.sent,
        totalReceived: data.received,
        responseRate: data.sent > 0 ? Math.round((data.received / data.sent) * 100) : 0,
      }));

      // 3. Lead Aging (active leads sorted by inactivity)
      const activeLeads = leads.filter((l: any) => l.status_final === 'ATIVO');
      const leadAging: LeadAging[] = activeLeads
        .map((l: any) => ({
          id: l.id,
          name: l.name,
          stage: l.stage,
          daysWithoutAction: Math.max(0, differenceInHours(now, new Date(l.next_action_at)) / 24),
          priority: l.priority,
          lastTouchDays: l.last_touch_at ? differenceInDays(now, new Date(l.last_touch_at)) : differenceInDays(now, new Date(l.created_at)),
        }))
        .sort((a: LeadAging, b: LeadAging) => b.lastTouchDays - a.lastTouchDays)
        .slice(0, 20);

      // 4. Segment Performance (by lead_type and origin)
      const segmentByType: Record<string, { total: number; converted: number; cycleDays: number[] }> = {};
      leads.forEach((l: any) => {
        const key = l.lead_type;
        if (!segmentByType[key]) segmentByType[key] = { total: 0, converted: 0, cycleDays: [] };
        segmentByType[key].total++;
        if (l.status_final === 'CONVERTIDO') {
          segmentByType[key].converted++;
          segmentByType[key].cycleDays.push(differenceInDays(new Date(l.updated_at), new Date(l.created_at)));
        }
      });

      const segmentByOrigin: Record<string, { total: number; converted: number; cycleDays: number[] }> = {};
      leads.forEach((l: any) => {
        const key = l.origin;
        if (!segmentByOrigin[key]) segmentByOrigin[key] = { total: 0, converted: 0, cycleDays: [] };
        segmentByOrigin[key].total++;
        if (l.status_final === 'CONVERTIDO') {
          segmentByOrigin[key].converted++;
          segmentByOrigin[key].cycleDays.push(differenceInDays(new Date(l.updated_at), new Date(l.created_at)));
        }
      });

      const typeLabels: Record<string, string> = {
        PROFISSIONAL: 'Profissional',
        DISTRIBUIDOR: 'Distribuidor',
        NAO_QUALIFICADO: 'Não Qualificado',
      };

      const originLabels: Record<string, string> = {
        NUVEMSHOP: 'Nuvemshop', INSTAGRAM: 'Instagram', GOOGLE: 'Google',
        WHATSAPP: 'WhatsApp', TELEFONE: 'Telefone', INDICACAO: 'Indicação',
        PRESENCIAL_EMPRESA: 'Presencial', VISITA_SALAO: 'Visita Salão',
      };

      const segmentPerformance: SegmentPerformance[] = [
        ...Object.entries(segmentByType).map(([key, data]) => ({
          segment: key,
          label: typeLabels[key] || key,
          totalLeads: data.total,
          convertedLeads: data.converted,
          conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
          avgCycleDays: data.cycleDays.length > 0
            ? Math.round(data.cycleDays.reduce((a, b) => a + b, 0) / data.cycleDays.length)
            : 0,
        })),
        ...Object.entries(segmentByOrigin).map(([key, data]) => ({
          segment: key,
          label: originLabels[key] || key,
          totalLeads: data.total,
          convertedLeads: data.converted,
          conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
          avgCycleDays: data.cycleDays.length > 0
            ? Math.round(data.cycleDays.reduce((a, b) => a + b, 0) / data.cycleDays.length)
            : 0,
        })),
      ];

      // Summary metrics
      const totalActive = activeLeads.length;
      const totalConverted = leads.filter((l: any) => l.status_final === 'CONVERTIDO').length;
      const totalLost = leads.filter((l: any) => l.status_final === 'PERDIDO').length;
      const overallConversion = leads.length > 0 ? Math.round((totalConverted / leads.length) * 100) : 0;
      const totalOverdue = activeLeads.filter((l: any) => new Date(l.next_action_at) < now).length;

      return {
        stageBottlenecks,
        channelMetrics,
        leadAging,
        segmentPerformance,
        summary: { totalActive, totalConverted, totalLost, overallConversion, totalOverdue, totalLeads: leads.length },
      };
    },
    enabled: !!user,
  });
}
