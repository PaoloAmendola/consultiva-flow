import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  DbLead, 
  LeadInsert, 
  LeadUpdate, 
  LeadType, 
  LeadOrigin, 
  LeadStatusFinal,
  LeadPriority
} from '@/types/database';
import { enrichLeadWithNBA, sortLeadsByActionability, NBAResult } from '@/lib/nba-engine';

export type EnrichedLead = DbLead & NBAResult;

interface LeadFilters {
  leadType?: LeadType;
  origin?: LeadOrigin;
  stage?: string;
  priority?: LeadPriority;
  statusFinal?: LeadStatusFinal;
  search?: string;
}

// Helper to get supabase client with any type to bypass type checking
// until types are regenerated
const getSupabaseClient = () => supabase as any;

export function useLeads(filters?: LeadFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', filters, user?.id],
    queryFn: async (): Promise<EnrichedLead[]> => {
      if (!user) return [];

      const client = getSupabaseClient();
      let query = client
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('next_action_at', { ascending: true });

      if (filters?.leadType) {
        query = query.eq('lead_type', filters.leadType);
      }
      if (filters?.origin) {
        query = query.eq('origin', filters.origin);
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.statusFinal) {
        query = query.eq('status_final', filters.statusFinal);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      // Enrich leads with NBA data
      const enrichedLeads = (data || []).map((lead: DbLead) => enrichLeadWithNBA(lead));
      return enrichedLeads;
    },
    enabled: !!user,
  });
}

export function useActiveLeads(filters?: LeadFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', 'active', filters, user?.id],
    queryFn: async (): Promise<EnrichedLead[]> => {
      if (!user) return [];

      const client = getSupabaseClient();
      let query = client
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status_final', 'ATIVO')
        .order('next_action_at', { ascending: true });

      if (filters?.leadType) {
        query = query.eq('lead_type', filters.leadType);
      }
      if (filters?.origin) {
        query = query.eq('origin', filters.origin);
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching active leads:', error);
        throw error;
      }

      const enrichedLeads = (data || []).map((lead: DbLead) => enrichLeadWithNBA(lead));
      return enrichedLeads;
    },
    enabled: !!user,
  });
}

export function useActionableLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', 'actionable', user?.id],
    queryFn: async (): Promise<EnrichedLead[]> => {
      if (!user) return [];

      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status_final', 'ATIVO')
        .lte('next_action_at', fourHoursFromNow.toISOString())
        .order('next_action_at', { ascending: true });

      if (error) {
        console.error('Error fetching actionable leads:', error);
        throw error;
      }

      const enrichedLeads = (data || []).map((lead: DbLead) => enrichLeadWithNBA(lead));
      return sortLeadsByActionability(enrichedLeads);
    },
    enabled: !!user,
  });
}

export function useLead(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead', id, user?.id],
    queryFn: async (): Promise<EnrichedLead | null> => {
      if (!user || !id) return null;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching lead:', error);
        throw error;
      }

      return data ? enrichLeadWithNBA(data as DbLead) : null;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leadData: LeadInsert): Promise<DbLead> => {
      if (!user) throw new Error('Usuário não autenticado');

      // Validate required fields
      if (!leadData.next_action_type || !leadData.next_action_at) {
        throw new Error('Próxima ação e data são obrigatórios');
      }

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leads')
        .insert({
          ...leadData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        throw error;
      }

      return data as DbLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar lead');
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadUpdate }): Promise<DbLead> => {
      if (!user) throw new Error('Usuário não autenticado');

      const client = getSupabaseClient();
      const { data: updatedLead, error } = await client
        .from('leads')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }

      return updatedLead as DbLead;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      toast.success('Lead atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar lead');
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error('Usuário não autenticado');

      const client = getSupabaseClient();
      const { error } = await client
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting lead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead removido');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover lead');
    },
  });
}
