import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useClientOrders } from '@/hooks/useClientOrders';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function OrdersEvolutionChart() {
  const { data: orders, isLoading } = useClientOrders();

  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const days = 30;
    const buckets: Record<string, { count: number; value: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), 'dd/MM');
      buckets[key] = { count: 0, value: 0 };
    }
    orders.forEach(o => {
      const key = format(new Date(o.order_date), 'dd/MM');
      if (buckets[key]) {
        buckets[key].count += 1;
        buckets[key].value += Number(o.total_value);
      }
    });
    return Object.entries(buckets).map(([date, v]) => ({
      date,
      pedidos: v.count,
      valor: Math.round(v.value * 100) / 100,
    }));
  }, [orders]);

  if (isLoading || !orders || orders.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Pedidos — Últimos 30 dias</p>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [
                  name === 'valor' ? `R$ ${value.toFixed(2)}` : value,
                  name === 'valor' ? 'Valor' : 'Pedidos',
                ]}
              />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
