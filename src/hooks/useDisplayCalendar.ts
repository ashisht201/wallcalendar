import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DisplayCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  colorId?: string;
}

export const useDisplayCalendar = (accessCode: string | undefined, currentMonth: Date, timeMaxOverride?: Date) => {
  const [events, setEvents] = useState<DisplayCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!accessCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = timeMaxOverride || endOfMonth(currentMonth);

      const { data, error: invokeError } = await supabase.functions.invoke('display-calendar', {
        body: {
          accessCode,
          timeMin: monthStart.toISOString(),
          timeMax: monthEnd.toISOString(),
        },
      });

      if (invokeError) {
        console.error('Display calendar fetch error:', invokeError);
        setError(invokeError.message || 'Failed to fetch calendar');
        setEvents([]);
        return;
      }

      if (data.error) {
        setError(data.error);
        setEvents([]);
        return;
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching display calendar:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [accessCode, currentMonth, timeMaxOverride]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!accessCode) return;
    
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessCode, fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
};
