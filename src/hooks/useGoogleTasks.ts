import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string;
  completed: boolean;
}

export const useGoogleTasks = (isAuthenticated: boolean, providerToken?: string | null) => {
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated || !providerToken) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-tasks', {
        body: { providerToken, action: 'list' },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Failed to fetch tasks');
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return;
      }

      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, providerToken]);

  const toggleTask = useCallback(async (taskId: string, currentlyCompleted: boolean) => {
    if (!providerToken) return;

    try {
      const action = currentlyCompleted ? 'uncomplete' : 'complete';
      const { data, error: fnError } = await supabase.functions.invoke('google-tasks', {
        body: { providerToken, action, taskId },
      });

      if (fnError || data.error) {
        console.error('Toggle error:', fnError || data.error);
        return;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !currentlyCompleted, status: currentlyCompleted ? 'needsAction' : 'completed' }
          : task
      ));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  }, [providerToken]);

  const createTask = useCallback(async (title: string) => {
    if (!providerToken || !title.trim()) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-tasks', {
        body: { providerToken, action: 'create', title: title.trim() },
      });

      if (fnError || data.error) {
        console.error('Create error:', fnError || data.error);
        return;
      }

      // Refresh tasks list
      await fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  }, [providerToken, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    toggleTask,
    createTask,
  };
};
