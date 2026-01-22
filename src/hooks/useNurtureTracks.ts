import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DbNurtureTrack, LeadType, NurtureStep } from '@/types/database';

// Helper to get supabase client with any type to bypass type checking
const getSupabaseClient = () => supabase as any;

export function useNurtureTracks(leadType?: LeadType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nurture-tracks', leadType, user?.id],
    queryFn: async (): Promise<DbNurtureTrack[]> => {
      if (!user) return [];

      const client = getSupabaseClient();
      let query = client
        .from('nurture_tracks')
        .select('*')
        .order('name', { ascending: true });

      if (leadType) {
        query = query.eq('lead_type', leadType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching nurture tracks:', error);
        throw error;
      }

      return (data || []).map((track: DbNurtureTrack) => ({
        ...track,
        steps: (track.steps as NurtureStep[]) || [],
      }));
    },
    enabled: !!user,
  });
}

export function useNurtureTrack(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nurture-track', id, user?.id],
    queryFn: async (): Promise<DbNurtureTrack | null> => {
      if (!user || !id) return null;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('nurture_tracks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching nurture track:', error);
        throw error;
      }

      if (!data) return null;

      const trackData = data as DbNurtureTrack;
      return {
        ...trackData,
        steps: (trackData.steps as NurtureStep[]) || [],
      };
    },
    enabled: !!user && !!id,
  });
}
