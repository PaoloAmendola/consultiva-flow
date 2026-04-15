import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const client = () => supabase as any;

export interface Playbook {
  id: string;
  stage: string;
  lead_type: string;
  title: string;
  description: string | null;
  objectives: string[];
  key_questions: string[];
  scripts: { label: string; content: string }[];
  recommended_assets: string[];
  objection_handlers: { objection: string; response: string }[];
  success_criteria: string[];
  next_stage_trigger: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePlaybooks(stage?: string, leadType?: string) {
  return useQuery({
    queryKey: ['playbooks', stage, leadType],
    queryFn: async (): Promise<Playbook[]> => {
      let query = client()
        .from('playbooks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (stage) query = query.eq('stage', stage);
      if (leadType) query = query.eq('lead_type', leadType);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Playbook[];
    },
  });
}

export function usePlaybookForLead(stage: string, leadType: string) {
  return useQuery({
    queryKey: ['playbook', stage, leadType],
    queryFn: async (): Promise<Playbook | null> => {
      const { data, error } = await client()
        .from('playbooks')
        .select('*')
        .eq('stage', stage)
        .eq('lead_type', leadType)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Playbook | null;
    },
    enabled: !!stage && !!leadType,
  });
}
