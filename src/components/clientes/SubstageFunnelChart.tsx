import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RECORRENCIA_SUBSTAGES } from '@/types/database';
import type { EnrichedLead } from '@/hooks/useLeads';

const COLORS = [
  'hsl(217, 91%, 60%)',   // D+2 blue
  'hsl(48, 96%, 53%)',    // D+7 yellow
  'hsl(160, 84%, 39%)',   // D+15 emerald
  'hsl(25, 95%, 53%)',    // D+30 orange
  'hsl(271, 91%, 65%)',   // D+45 purple
  'hsl(330, 81%, 60%)',   // D+60 pink
  'hsl(0, 84%, 60%)',     // D+90 red
];

interface Props {
  clients: EnrichedLead[];
}

export function SubstageFunnelChart({ clients }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      const sub = c.substatus || 'D+2';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return RECORRENCIA_SUBSTAGES.map(s => ({
      name: s.value,
      label: s.label,
      count: counts[s.value] || 0,
    }));
  }, [clients]);

  if (clients.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Funil Pós-Venda</p>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={40}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, _: string, entry: any) => [
                  `${value} cliente${value !== 1 ? 's' : ''}`,
                  entry.payload.label,
                ]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
