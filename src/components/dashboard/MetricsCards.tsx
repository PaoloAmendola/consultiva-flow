import { useActiveLeads, useActionableLeads } from '@/hooks/useLeads';
import { useOpenTasks } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, CheckSquare, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  subtitle?: string;
  isLoading?: boolean;
}

function MetricCard({ title, value, icon, variant = 'default', subtitle, isLoading }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    danger: 'bg-destructive/10 text-destructive',
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', variantStyles[variant])}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsCards() {
  const { data: actionableLeads, isLoading: actionableLoading } = useActionableLeads();
  const { data: allActiveLeads, isLoading: activeLoading } = useActiveLeads();
  const { data: tasks, isLoading: tasksLoading } = useOpenTasks();

  const totalActive = allActiveLeads?.length ?? 0;
  const overdueActions = actionableLeads?.filter(l => l.isOverdue).length ?? 0;
  const pendingTasks = tasks?.length ?? 0;
  const todayActions = actionableLeads?.filter(l => {
    const actionDate = new Date(l.next_action_at);
    const today = new Date();
    return actionDate.toDateString() === today.toDateString();
  }).length ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Leads Ativos"
        value={totalActive}
        icon={<Users className="h-5 w-5" />}
        variant="default"
        isLoading={activeLoading}
      />
      <MetricCard
        title="Ações Hoje"
        value={todayActions}
        icon={<Clock className="h-5 w-5" />}
        variant="success"
        isLoading={actionableLoading}
      />
      <MetricCard
        title="Atrasadas"
        value={overdueActions}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant={overdueActions > 0 ? 'danger' : 'default'}
        isLoading={actionableLoading}
      />
      <MetricCard
        title="Tarefas"
        value={pendingTasks}
        icon={<CheckSquare className="h-5 w-5" />}
        variant="warning"
        isLoading={tasksLoading}
      />
    </div>
  );
}
