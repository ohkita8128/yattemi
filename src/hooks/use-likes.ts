'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export function useLikes(postId: string) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = getClient();

  const fetchLikes = useCallback(async () => {
    try {
      // いいね数を取得
      const { count } = await (supabase as any)
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setLikesCount(count || 0);

      // 自分がいいねしてるか確認
      if (user) {
        const { data } = await (supabase as any)
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!data);
      }
    } catch (error) {
      // single()でデータがない場合もエラーになるので無視
    } finally {
      setIsLoading(false);
    }
  }, [postId, user, supabase]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await (supabase as any)
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await (supabase as any)
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return { likesCount, isLiked, isLoading, toggleLike };
}

export function useMyLikedPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = getClient();

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!user) return;

      try {
        const { data, error } = await (supabase as any)
          .from('likes')
          .select(`
            post:posts(
              *,
              profile:profiles(*),
              category:categories(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data?.map((d: any) => d.post) || []);
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedPosts();
  }, [user, supabase]);

  return { posts, isLoading };
}
