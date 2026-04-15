import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AiAnalyticsEvent {
  lead_id: string;
  event_type: 'shown' | 'accepted' | 'ignored' | 'action_taken';
  suggested_action?: string;
  suggested_channel?: string;
  actual_channel?: string;
  suggested_asset?: string;
  actual_asset?: string;
  recommendation_summary?: string;
  metadata?: Record<string, unknown>;
}

const client = () => supabase as any;

export function useTrackAiEvent() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: AiAnalyticsEvent) => {
      if (!user) return;
      const { error } = await client()
        .from('ai_analytics')
        .insert({ ...event, user_id: user.id });
      if (error) console.error('AI analytics error:', error);
    },
  });
}

export function useAiAnalytics(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai_analytics', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      let query = client()
        .from('ai_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dateRange?.from) query = query.gte('created_at', dateRange.from);
      if (dateRange?.to) query = query.lte('created_at', dateRange.to);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
