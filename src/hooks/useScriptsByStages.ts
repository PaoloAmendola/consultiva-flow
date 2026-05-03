import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DbScript } from './useScripts';

const getClient = () => supabase as any;

/**
 * Batch-fetch scripts for multiple stages in a single query.
 * Hydrates the per-stage cache used by useScripts(stage) so that
 * LeadCard's existing useScripts call resolves from cache (no N+1).
 */
export function useScriptsByStages(stages: string[]) {
  const queryClient = useQueryClient();
  const uniqueStages = useMemo(
    () => Array.from(new Set(stages.filter(Boolean))).sort(),
    [stages],
  );

  const query = useQuery({
    queryKey: ['scripts', 'by-stages', uniqueStages],
    enabled: uniqueStages.length > 0,
    queryFn: async (): Promise<Record<string, DbScript[]>> => {
      const client = getClient();
      const { data, error } = await client
        .from('scripts')
        .select('*')
        .in('stage', uniqueStages)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const grouped: Record<string, DbScript[]> = {};
      for (const stage of uniqueStages) grouped[stage] = [];
      for (const script of (data || []) as DbScript[]) {
        (grouped[script.stage] ||= []).push(script);
      }
      return grouped;
    },
  });

  // Hydrate per-stage cache so individual useScripts(stage) calls hit cache
  useEffect(() => {
    if (!query.data) return;
    for (const [stage, scripts] of Object.entries(query.data)) {
      queryClient.setQueryData(['scripts', stage], scripts);
    }
  }, [query.data, queryClient]);

  return query;
}
