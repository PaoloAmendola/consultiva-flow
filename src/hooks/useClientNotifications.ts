import { useEffect, useRef } from 'react';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { RECORRENCIA_SUBSTAGES } from '@/types/database';
import type { EnrichedLead } from '@/hooks/useLeads';

/**
 * Checks clients who have reached or exceeded the deadline for their current substage.
 * Shows toast notifications for clients that need attention.
 */
export function useClientNotifications(clients: EnrichedLead[] | undefined) {
  const hasNotified = useRef(false);

  useEffect(() => {
    if (!clients || clients.length === 0 || hasNotified.current) return;
    hasNotified.current = true;

    const alerts: { name: string; substage: string; label: string }[] = [];

    clients.forEach(client => {
      const currentSub = client.substatus || 'D+2';
      const stageConfig = RECORRENCIA_SUBSTAGES.find(s => s.value === currentSub);
      if (!stageConfig) return;

      const currentIdx = RECORRENCIA_SUBSTAGES.findIndex(s => s.value === currentSub);
      if (currentIdx >= RECORRENCIA_SUBSTAGES.length - 1) return; // already at last stage

      const nextStage = RECORRENCIA_SUBSTAGES[currentIdx + 1];
      // Days since they entered the current substage (approximation using updated_at)
      const daysSinceUpdate = differenceInDays(new Date(), new Date(client.updated_at));
      
      // Check if enough days have passed to advance to next stage
      const daysNeeded = nextStage.day - stageConfig.day;
      if (daysSinceUpdate >= daysNeeded) {
        alerts.push({
          name: client.name.split(' ')[0],
          substage: nextStage.value,
          label: nextStage.label,
        });
      }
    });

    if (alerts.length > 0) {
      // Show up to 3 notifications to avoid spam
      const toShow = alerts.slice(0, 3);
      setTimeout(() => {
        toShow.forEach((alert, i) => {
          setTimeout(() => {
            toast.info(`⏰ ${alert.name} atingiu ${alert.substage}`, {
              description: `Hora de: ${alert.label}. Avance a sub-etapa!`,
              duration: 8000,
            });
          }, i * 1500);
        });

        if (alerts.length > 3) {
          setTimeout(() => {
            toast.info(`E mais ${alerts.length - 3} clientes precisam de atenção`, {
              duration: 6000,
            });
          }, toShow.length * 1500);
        }
      }, 1000);
    }
  }, [clients]);
}
