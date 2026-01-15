import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DisplaySession {
  id: string;
  user_id: string;
  access_code: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

// Generate a random 6-character alphanumeric code
const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useDisplaySessions = (userId: string | undefined) => {
  const [sessions, setSessions] = useState<DisplaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('display_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching display sessions:', fetchError);
        setError(fetchError.message);
        return;
      }

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching display sessions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (name?: string): Promise<DisplaySession | null> => {
    if (!userId) return null;

    try {
      // Generate unique access code (retry if collision)
      let accessCode = generateAccessCode();
      let attempts = 0;
      
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from('display_sessions')
          .select('id')
          .eq('access_code', accessCode)
          .single();
        
        if (!existing) break;
        accessCode = generateAccessCode();
        attempts++;
      }

      const { data, error: insertError } = await supabase
        .from('display_sessions')
        .insert({
          user_id: userId,
          access_code: accessCode,
          name: name || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating display session:', insertError);
        setError(insertError.message);
        return null;
      }

      setSessions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating display session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('display_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error revoking display session:', updateError);
        setError(updateError.message);
        return false;
      }

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, is_active: false } : s))
      );
      return true;
    } catch (err) {
      console.error('Error revoking display session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('display_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) {
        console.error('Error deleting display session:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Error deleting display session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    revokeSession,
    deleteSession,
    refetch: fetchSessions,
  };
};
