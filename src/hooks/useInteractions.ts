import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DbInteraction, InteractionInsert } from '@/types/database';

// Helper to get supabase client with any type to bypass type checking
const getSupabaseClient = () => supabase as any;

export function useInteractions(leadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['interactions', leadId, user?.id],
    queryFn: async (): Promise<DbInteraction[]> => {
      if (!user || !leadId) return [];

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching interactions:', error);
        throw error;
      }

      return (data || []) as DbInteraction[];
    },
    enabled: !!user && !!leadId,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (interactionData: InteractionInsert): Promise<DbInteraction> => {
      if (!user) throw new Error('Usuário não autenticado');

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('interactions')
        .insert({
          ...interactionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating interaction:', error);
        throw error;
      }

      return data as DbInteraction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interactions', variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Interação registrada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar interação');
    },
  });
}

// Helper to create a stage change interaction
export function useCreateStageChangeInteraction() {
  const createInteraction = useCreateInteraction();

  return useMutation({
    mutationFn: async ({ leadId, fromStage, toStage }: { leadId: string; fromStage: string; toStage: string }) => {
      return createInteraction.mutateAsync({
        lead_id: leadId,
        type: 'MUDANCA_ETAPA',
        direction: 'OUT',
        content: `Mudança de etapa: ${fromStage} → ${toStage}`,
      });
    },
  });
}
