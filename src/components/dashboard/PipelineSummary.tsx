import { useActiveLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PROFISSIONAL_STAGES, DISTRIBUIDOR_STAGES } from '@/types/database';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export function PipelineSummary() {
  const { data: leads, isLoading } = useActiveLeads();

  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!leads || leads.length === 0) return null;

  // Count leads per stage
  const allStages = [...PROFISSIONAL_STAGES, ...DISTRIBUIDOR_STAGES];
  const stageCounts: Record<string, { label: string; count: number; color: string }> = {};

  leads.forEach(lead => {
    const stages = lead.lead_type === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
    const stage = stages.find(s => s.value === lead.stage);
    if (stage) {
      if (!stageCounts[stage.value]) {
        stageCounts[stage.value] = { label: stage.label, count: 0, color: stage.color };
      }
      stageCounts[stage.value].count++;
    }
  });

  const entries = Object.entries(stageCounts)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  const maxCount = Math.max(...entries.map(([, v]) => v.count));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Pipeline</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([key, { label, count, color }]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 truncate">{label}</span>
            <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', color)}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
