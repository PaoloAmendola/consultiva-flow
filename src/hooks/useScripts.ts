import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DbScript {
  id: string;
  stage: string;
  title: string;
  content: string;
  sort_order: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const getClient = () => supabase as any;

export function useScripts(stage?: string) {
  return useQuery({
    queryKey: ['scripts', stage],
    queryFn: async (): Promise<DbScript[]> => {
      const client = getClient();
      let query = client
        .from('scripts')
        .select('*')
        .order('sort_order', { ascending: true });

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DbScript[];
    },
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (script: { stage: string; title: string; content: string; sort_order?: number; tags?: string[] }) => {
      const client = getClient();
      const { data, error } = await client.from('scripts').insert(script).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      toast.success('Script criado!');
    },
    onError: () => toast.error('Erro ao criar script'),
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DbScript> }) => {
      const client = getClient();
      const { error } = await client.from('scripts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      toast.success('Script atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar script'),
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      const { error } = await client.from('scripts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      toast.success('Script removido!');
    },
    onError: () => toast.error('Erro ao remover script'),
  });
}
