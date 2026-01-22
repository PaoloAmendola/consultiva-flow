import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DbTask, TaskInsert, TaskUpdate, TaskStatus } from '@/types/database';

// Helper to get supabase client with any type to bypass type checking
const getSupabaseClient = () => supabase as any;

interface TaskFilters {
  status?: TaskStatus;
  leadId?: string;
}

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters, user?.id],
    queryFn: async (): Promise<DbTask[]> => {
      if (!user) return [];

      const client = getSupabaseClient();
      let query = client
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      return (data || []) as DbTask[];
    },
    enabled: !!user,
  });
}

export function useOpenTasks() {
  return useTasks({ status: 'OPEN' });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskData: TaskInsert): Promise<DbTask> => {
      if (!user) throw new Error('Usuário não autenticado');

      const client = getSupabaseClient();
      const { data, error } = await client
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      return data as DbTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa criada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar tarefa');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskUpdate }): Promise<DbTask> => {
      if (!user) throw new Error('Usuário não autenticado');

      const client = getSupabaseClient();
      const { data: updatedTask, error } = await client
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      return updatedTask as DbTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar tarefa');
    },
  });
}

export function useCompleteTask() {
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return updateTask.mutateAsync({
        id: taskId,
        data: { status: 'DONE' },
      });
    },
  });
}

export function useCancelTask() {
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return updateTask.mutateAsync({
        id: taskId,
        data: { status: 'CANCELED' },
      });
    },
  });
}
