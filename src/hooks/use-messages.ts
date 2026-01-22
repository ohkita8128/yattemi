'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function useMessages(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = getClient();

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, username, display_name, avatar_url)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, supabase]);

  useEffect(() => {
    fetchMessages();

    // リアルタイム購読
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload: any) => {
          // 送信者情報を取得
          const { data: sender } = await (supabase as any)
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, sender }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await (supabase as any)
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!user) return;

    try {
      await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return { messages, isLoading, sendMessage, markAsRead, refetch: fetchMessages };
}
