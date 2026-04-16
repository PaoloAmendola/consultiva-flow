import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Playbook } from './usePlaybooks';

const client = () => supabase as any;

export type PlaybookInput = Partial<Omit<Playbook, 'id' | 'created_at' | 'updated_at'>> & {
  stage: string;
  lead_type: string;
  title: string;
};

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaybookInput) => {
      const { data, error } = await client()
        .from('playbooks')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Playbook criado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: PlaybookInput & { id: string }) => {
      const { data, error } = await client()
        .from('playbooks')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Playbook atualizado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client().from('playbooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Playbook excluído.');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
