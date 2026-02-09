import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DbNurtureTrack, LeadType, NurtureStep } from '@/types/database';

const client = () => supabase as any;

export interface TrackInput {
  name: string;
  description?: string | null;
  lead_type: LeadType;
  steps: NurtureStep[];
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TrackInput) => {
      const { data, error } = await client().from('nurture_tracks').insert(input).select().single();
      if (error) throw error;
      return data as DbNurtureTrack;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurture-tracks'] }); toast.success('Trilha criada!'); },
    onError: (e: any) => toast.error(`Erro ao criar trilha: ${e.message}`),
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TrackInput & { id: string }) => {
      const { data, error } = await client().from('nurture_tracks').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as DbNurtureTrack;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurture-tracks'] }); toast.success('Trilha atualizada!'); },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client().from('nurture_tracks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurture-tracks'] }); toast.success('Trilha removida!'); },
    onError: (e: any) => toast.error(`Erro ao remover: ${e.message}`),
  });
}
