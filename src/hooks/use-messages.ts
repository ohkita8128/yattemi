'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { user, isLoading: authLoading } = useAuth();
  const supabaseRef = useRef(getClient());
  const supabase = supabaseRef.current;
  const subscriptionRef = useRef<any>(null);

  // 認証完了後に fetch + リアルタイム購読
  useEffect(() => {
    // 認証中または未認証なら何もしない
    if (authLoading) {
            return;
    }
    
    if (!user) {
            setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    
    const init = async () => {
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
        if (isMounted) {
                    setMessages(data || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[useMessages] Error fetching:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    // 既存のサブスクリプションがあれば解除
    if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // リアルタイム購読
    const channelName = `messages-${matchId}-${user.id}`;
        
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload: any) => {
                    
          if (!isMounted) {
                        return;
          }
          
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

    subscriptionRef.current = channel;

    return () => {
            isMounted = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [matchId, user, authLoading, supabase]);

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
      console.error('[useMessages] Error sending:', error);
      throw error;
    }
  };

  const markAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('[useMessages] Error marking as read:', error);
    }
  }, [matchId, user, supabase]);

  const refetch = useCallback(async () => {
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
      console.error('[useMessages] Error refetching:', error);
    }
  }, [matchId, supabase]);

  return { messages, isLoading, sendMessage, markAsRead, refetch };
}
