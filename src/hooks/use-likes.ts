'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export function useLikes(postId: string, initialCount?: number, initialIsLiked?: boolean) {
  const [likesCount, setLikesCount] = useState(initialCount ?? 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(initialIsLiked === undefined);
  const { user } = useAuth();

  // supabaseクライアントを安定させる
  const supabaseRef = useRef(getClient());

  // フェッチ済みフラグ
  const hasFetched = useRef(false);
  // initialCountが変わったら更新
  useEffect(() => {
    if (initialCount !== undefined) {
      setLikesCount(initialCount);
    }
  }, [initialCount]);

  // initialIsLiked が変わったら更新
  useEffect(() => {
    if (initialIsLiked !== undefined) {
      setIsLiked(initialIsLiked);
      setIsLoading(false);
    }
  }, [initialIsLiked]);

  useEffect(() => {
    // ✅ initialIsLiked が渡されていればfetch不要
    if (initialIsLiked !== undefined) return;
    // 既にフェッチ済みなら何もしない
    if (hasFetched.current) return;
    console.log('useLikes fetching for:', postId, 'initialIsLiked:', initialIsLiked);  // ← 追加
    const fetchLikes = async () => {
      const supabase = supabaseRef.current;

      try {
        // いいね数を取得（initialCountがなければ）
        if (initialCount === undefined) {
          const { count, error: countError } = await (supabase as any)
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          if (!countError) {
            setLikesCount(count || 0);
          }
        }

        // 自分がいいねしてるか確認
        if (user) {
          const { data } = await (supabase as any)
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle(); // single()ではなくmaybeSingle()を使う

          setIsLiked(!!data);
        }

        hasFetched.current = true;
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikes();
  }, [postId, user?.id]); // user全体ではなくuser.idだけを依存に

  // userが変わったらリセット
  useEffect(() => {
    hasFetched.current = false;
  }, [user?.id]);

  const toggleLike = useCallback(async () => {
    if (!user) return;

    const supabase = supabaseRef.current;

    try {
      if (isLiked) {
        const { error } = await (supabase as any)
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await (supabase as any)
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        if (!error) {
          setIsLiked(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, postId, isLiked]);

  return { likesCount, isLiked, isLoading, toggleLike };
}

export function useMyLikedPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const supabaseRef = useRef(getClient());
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) {
      if (!user) setIsLoading(false);
      return;
    }

    const fetchLikedPosts = async () => {
      const supabase = supabaseRef.current;

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

        if (!error) {
          setPosts(data?.map((d: any) => d.post).filter(Boolean) || []);
        }

        hasFetched.current = true;
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedPosts();
  }, [user?.id]);

  return { posts, isLoading };
}
