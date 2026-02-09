import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DbAsset, LeadType } from '@/types/database';

const client = () => supabase as any;

export interface AssetInput {
  code: string;
  name: string;
  type: string;
  url: string;
  description?: string | null;
  for_lead_type?: LeadType[] | null;
  tags?: string[] | null;
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssetInput) => {
      const { data, error } = await client().from('assets').insert(input).select().single();
      if (error) throw error;
      return data as DbAsset;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset criado!'); },
    onError: (e: any) => toast.error(`Erro ao criar asset: ${e.message}`),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: AssetInput & { id: string }) => {
      const { data, error } = await client().from('assets').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as DbAsset;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset atualizado!'); },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client().from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset removido!'); },
    onError: (e: any) => toast.error(`Erro ao remover: ${e.message}`),
  });
}
