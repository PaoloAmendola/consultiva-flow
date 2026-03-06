import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const getClient = () => supabase as any;

export interface ClientOrder {
  id: string;
  user_id: string;
  lead_id: string;
  order_date: string;
  total_value: number;
  items: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientOrders(leadId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['client_orders', leadId, user?.id],
    queryFn: async (): Promise<ClientOrder[]> => {
      if (!user) return [];
      const client = getClient();
      let query = client.from('client_orders').select('*').eq('user_id', user.id).order('order_date', { ascending: false });
      if (leadId) query = query.eq('lead_id', leadId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ClientOrder[];
    },
    enabled: !!user,
  });
}

export function useCreateClientOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (order: { lead_id: string; total_value: number; items: string; notes?: string; order_date?: string }) => {
      if (!user) throw new Error('Não autenticado');
      const client = getClient();
      const { data, error } = await client.from('client_orders').insert({ ...order, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_orders'] });
      toast.success('Pedido registrado!');
    },
    onError: () => toast.error('Erro ao registrar pedido'),
  });
}
