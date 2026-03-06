import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RECORRENCIA_SUBSTAGES } from '@/types/database';
import { differenceInDays } from 'date-fns';
import type { EnrichedLead } from '@/hooks/useLeads';

interface ClientesDashboardProps {
  clients: EnrichedLead[];
}

interface MetricProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  detail?: string;
}

function Metric({ label, value, icon, color, detail }: MetricProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn('p-2 rounded-xl flex-shrink-0', color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          {detail && <p className="text-[10px] text-muted-foreground truncate">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientesDashboard({ clients }: ClientesDashboardProps) {
  const metrics = useMemo(() => {
    const total = clients.length;

    // Reposition rate: clients at D+30 or beyond / total
    const atOrPastD30 = clients.filter(c => {
      const idx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === (c.substatus || 'D+2'));
      return idx >= 3; // D+30 is index 3
    }).length;
    const reposicaoRate = total > 0 ? Math.round((atOrPastD30 / total) * 100) : 0;

    // Churn risk: clients stuck in early stages (D+2 or D+7) for more than 14 days
    const churnRisk = clients.filter(c => {
      const sub = c.substatus || 'D+2';
      const idx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === sub);
      if (idx > 1) return false; // only D+2 and D+7
      const daysSince = differenceInDays(new Date(), new Date(c.updated_at));
      return daysSince > 14;
    }).length;

    // Average "NPS" approximation: based on progression depth
    // Clients further along score higher (simple heuristic)
    const avgScore = total > 0 
      ? (clients.reduce((sum, c) => {
          const idx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === (c.substatus || 'D+2'));
          return sum + Math.round(((idx + 1) / RECORRENCIA_SUBSTAGES.length) * 10);
        }, 0) / total).toFixed(1)
      : '—';

    return { total, reposicaoRate, churnRisk, avgScore };
  }, [clients]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Metric
        label="Total Clientes"
        value={metrics.total}
        icon={<Users className="h-5 w-5" />}
        color="bg-info/10 text-info"
      />
      <Metric
        label="Taxa Reposição"
        value={`${metrics.reposicaoRate}%`}
        icon={<ShoppingCart className="h-5 w-5" />}
        color="bg-success/10 text-success"
        detail={`${metrics.reposicaoRate}% avançaram D+30`}
      />
      <Metric
        label="Score Médio"
        value={metrics.avgScore}
        icon={<TrendingUp className="h-5 w-5" />}
        color="bg-warning/10 text-warning"
        detail="Baseado na progressão"
      />
      <Metric
        label="Risco de Churn"
        value={metrics.churnRisk}
        icon={<AlertTriangle className="h-5 w-5" />}
        color={metrics.churnRisk > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}
        detail={metrics.churnRisk > 0 ? 'Parados há +14 dias' : 'Nenhum risco'}
      />
    </div>
  );
}
