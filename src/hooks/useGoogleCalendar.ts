import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  colorId?: string;
}

export const useGoogleCalendar = (currentMonth: Date, isAuthenticated: boolean) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsAuth(false);

    try {
      // Get events for current month plus a buffer
      const timeMin = startOfMonth(currentMonth).toISOString();
      const timeMax = endOfMonth(addMonths(currentMonth, 1)).toISOString();

      const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
        body: { timeMin, timeMax },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Failed to fetch calendar events');
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        if (data.needsAuth) {
          setNeedsAuth(true);
        }
        setError(data.error);
        return;
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    needsAuth,
    refetch: fetchEvents,
  };
};
