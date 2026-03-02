import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DbAsset, LeadType } from '@/types/database';

// Helper to get supabase client with any type to bypass type checking
const getSupabaseClient = () => supabase as any;

export function useAssets(filters?: { type?: string; leadType?: LeadType; search?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assets', filters, user?.id],
    queryFn: async (): Promise<DbAsset[]> => {
      if (!user) return [];

      const client = getSupabaseClient();
      let query = client
        .from('assets')
        .select('*')
        .order('code', { ascending: true });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.search) {
        const escaped = filters.search.replace(/[%_\\]/g, '\\$&');
        query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%,code.ilike.%${escaped}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }

      let assets = (data || []) as DbAsset[];

      // Filter by lead type if specified
      if (filters?.leadType) {
        assets = assets.filter(asset => 
          !asset.for_lead_type || 
          asset.for_lead_type.length === 0 || 
          asset.for_lead_type.includes(filters.leadType!)
        );
      }

      return assets;
    },
    enabled: !!user,
  });
}

export function useAsset(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['asset', id, user?.id],
    queryFn: async (): Promise<DbAsset | null> => {
      if (!user || !id) return null;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching asset:', error);
        throw error;
      }

      return data as DbAsset | null;
    },
    enabled: !!user && !!id,
  });
}

export function useAssetByCode(code: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['asset', 'code', code, user?.id],
    queryFn: async (): Promise<DbAsset | null> => {
      if (!user || !code) return null;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('assets')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        console.error('Error fetching asset by code:', error);
        throw error;
      }

      return data as DbAsset | null;
    },
    enabled: !!user && !!code,
  });
}
