'use client';

import { useState, useEffect, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { PostWithRelations } from '@/types';

export function useRecommendations(limit: number = 6) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(getClient());
  const hasFetched = useRef(false);  // 追加: 一度だけ実行

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // 既に取得済みならスキップ
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchRecommendations = async () => {
      const supabase = supabaseRef.current;
      setIsLoading(true);

      try {
        // 1. ユーザーがいいねした投稿のカテゴリを取得
        const { data: likedPosts } = await (supabase as any)
          .from('likes')
          .select('post:posts(category_id)')
          .eq('user_id', user.id)
          .limit(20);

        const likedCategories = likedPosts
          ?.map((l: any) => l.post?.category_id)
          .filter(Boolean) || [];

        // 重複を除去
        const uniqueCategories = Array.from(new Set(likedCategories)) as number[];

        // 2. おすすめ投稿を取得
        const now = new Date().toISOString();
        let query = (supabase as any)
          .from('posts')
          .select(`
            *,
            profile:profiles(*),
            category:categories(*)
          `)
          .eq('status', 'open')
          .neq('user_id', user.id)
          .or(`deadline_at.gt.${now},deadline_at.is.null`)
          .order('likes_count', { ascending: false })
          .limit(limit);

        // カテゴリがあれば絞り込み
        if (uniqueCategories.length > 0) {
          query = query.in('category_id', uniqueCategories);
        }

        const { data, error } = await query;

        if (error) throw error;

        // 3. 結果が少なければ人気投稿で補完
        if (!data || data.length < limit) {
          const existingIds = data?.map((p: any) => p.id) || [];
          
          const { data: popular } = await (supabase as any)
            .from('posts')
            .select(`
              *,
              profile:profiles(*),
              category:categories(*)
            `)
            .eq('status', 'open')
            .neq('user_id', user.id)
            .not('id', 'in', `(${existingIds.join(',') || 'null'})`)
            .or(`deadline_at.gt.${now},deadline_at.is.null`)
            .order('likes_count', { ascending: false })
            .limit(limit - (data?.length || 0));

          setPosts([...(data || []), ...(popular || [])]);
        } else {
          setPosts(data);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.id, limit]);

  return { posts, isLoading };
}