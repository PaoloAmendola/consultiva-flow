import { useActiveLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ACENDER_STAGES, mapLegacyStage } from '@/types/database';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export function PipelineSummary() {
  const { data: leads, isLoading } = useActiveLeads();

  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!leads || leads.length === 0) return null;

  // Count leads per ACENDER stage
  const stageCounts: Record<string, { label: string; count: number; color: string; letter: string }> = {};

  leads.forEach(lead => {
    const resolvedStage = mapLegacyStage(lead.stage);
    const stage = ACENDER_STAGES.find(s => s.value === resolvedStage);
    if (stage) {
      if (!stageCounts[stage.value]) {
        stageCounts[stage.value] = { label: stage.label, count: 0, color: stage.color, letter: stage.letter };
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
      <CardContent className="space-y-2.5">
        {entries.map(([key, { label, count, color, letter }]) => (
          <div key={key} className="flex items-center gap-3 group">
            <span className="text-xs text-muted-foreground w-28 truncate group-hover:text-foreground transition-colors">{letter} · {label}</span>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2', color)}
                style={{ width: `${Math.max((count / maxCount) * 100, 12)}%` }}
              >
                <span className="text-[10px] font-bold text-white drop-shadow-sm">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
