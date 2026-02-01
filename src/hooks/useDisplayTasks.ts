import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DisplayTask {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string;
  completed: boolean;
}

export const useDisplayTasks = (accessCode: string | undefined) => {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!accessCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('display-tasks', {
        body: { accessCode },
      });

      if (invokeError) {
        console.error('Display tasks fetch error:', invokeError);
        setError(invokeError.message || 'Failed to fetch tasks');
        setTasks([]);
        return;
      }

      if (data.error) {
        setError(data.error);
        setTasks([]);
        return;
      }

      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching display tasks:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!accessCode) return;
    
    const interval = setInterval(fetchTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessCode, fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
};
