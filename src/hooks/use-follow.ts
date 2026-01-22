'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

interface FollowCounts {
  followers_count: number;
  following_count: number;
}

// フォロー状態とトグル
export function useFollow(targetUserId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = getClient();

  // フォロー状態を取得
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !targetUserId || user.id === targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await (supabase as any)
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();

        setIsFollowing(!!data);
      } catch (error) {
        setIsFollowing(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowing();
  }, [user, targetUserId, supabase]);

  // フォロー/アンフォロー切り替え
  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // アンフォロー
        await (supabase as any)
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        setIsFollowing(false);
      } else {
        // フォロー
        await (supabase as any)
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUserId, isFollowing, supabase]);

  return { isFollowing, isLoading, toggleFollow };
}

// フォロー数を取得
export function useFollowCounts(userId: string | undefined) {
  const [counts, setCounts] = useState<FollowCounts>({ followers_count: 0, following_count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchCounts = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .rpc('get_follow_counts', { target_user_id: userId });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setCounts(data[0]);
        }
      } catch (error) {
        console.error('Error fetching follow counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [userId, supabase]);

  return { counts, isLoading };
}

// フォロワー一覧
export function useFollowers(userId: string | undefined) {
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('follows')
          .select(`
            follower:profiles!follower_id(id, username, display_name, avatar_url)
          `)
          .eq('following_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFollowers(data?.map((d: any) => d.follower) || []);
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, supabase]);

  return { followers, isLoading };
}

// フォロー中一覧
export function useFollowing(userId: string | undefined) {
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('follows')
          .select(`
            following:profiles!following_id(id, username, display_name, avatar_url)
          `)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFollowing(data?.map((d: any) => d.following) || []);
      } catch (error) {
        console.error('Error fetching following:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowing();
  }, [userId, supabase]);

  return { following, isLoading };
}
