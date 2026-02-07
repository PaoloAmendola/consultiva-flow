import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnrichedLead } from './useLeads';
import { useAssets } from './useAssets';
import { useInteractions } from './useInteractions';
import { useNurtureTracks } from './useNurtureTracks';
import { differenceInDays } from 'date-fns';

export interface SalesCoachRecommendation {
  urgency: 'alta' | 'media' | 'baixa';
  summary: string;
  recommended_action?: {
    type: string;
    reason: string;
  };
  script?: {
    opening: string;
    key_points: string[];
    closing: string;
  };
  recommended_material?: {
    code: string | null;
    name: string;
    reason: string;
  };
  strategic_tips?: string[];
  objections_to_expect?: string[];
  next_steps?: string;
  raw_response?: string;
  error?: string;
}

interface LeadContextForAI {
  name: string;
  lead_type: string;
  stage: string;
  origin: string;
  priority: string;
  days_since_contact: number;
  nurture_track_name?: string;
  nurture_step?: number;
  next_action_type: string;
  observations?: string;
  interactions_count?: number;
  last_interaction_type?: string;
  available_assets: { code: string; name: string; type: string }[];
}

export function useSalesCoach(leadId?: string) {
  const { data: assets } = useAssets();
  const { data: interactions } = useInteractions(leadId || '');
  const { data: tracks } = useNurtureTracks();

  return useMutation({
    mutationFn: async (lead: EnrichedLead): Promise<SalesCoachRecommendation> => {
      const daysSinceContact = lead.last_touch_at 
        ? differenceInDays(new Date(), new Date(lead.last_touch_at))
        : differenceInDays(new Date(), new Date(lead.created_at));

      const availableAssets = (assets || [])
        .filter(a => !a.for_lead_type || a.for_lead_type.includes(lead.lead_type))
        .map(a => ({
          code: a.code,
          name: a.name,
          type: a.type,
        }));

      // Get nurture track name
      const nurtureTrack = tracks?.find(t => t.id === lead.nurture_track_id);

      const leadContext: LeadContextForAI = {
        name: lead.name,
        lead_type: lead.lead_type,
        stage: lead.stage,
        origin: lead.origin,
        priority: lead.priority,
        days_since_contact: daysSinceContact,
        next_action_type: lead.next_action_type,
        observations: lead.observations || undefined,
        available_assets: availableAssets,
        interactions_count: interactions?.length ?? 0,
        last_interaction_type: interactions?.[0]?.type || undefined,
        nurture_track_name: nurtureTrack?.name || undefined,
        nurture_step: lead.nurture_step ?? undefined,
      };

      const { data, error } = await supabase.functions.invoke('sales-coach', {
        body: { lead_context: leadContext },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao consultar assistente');
      }

      return data as SalesCoachRecommendation;
    },
  });
}
