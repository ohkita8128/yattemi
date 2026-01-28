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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchRecommendations = async () => {
      const supabase = supabaseRef.current;
      setIsLoading(true);

      try {
        // 1. ユーザーの興味カテゴリを取得（user_interests テーブルから）
        const { data: userInterests } = await (supabase as any)
          .from('user_interests')
          .select('category_id')
          .eq('user_id', user.id);

        const interestCategories = userInterests?.map((i: any) => i.category_id) || [];

        // 2. いいねした投稿のカテゴリも取得（行動ベース）
        const { data: likedPosts } = await (supabase as any)
          .from('likes')
          .select('post:posts(category_id)')
          .eq('user_id', user.id)
          .limit(20);

        const likedCategories = likedPosts
          ?.map((l: any) => l.post?.category_id)
          .filter(Boolean) || [];

        // 3. 両方を組み合わせて重複排除
        const allCategories = Array.from(new Set([...interestCategories, ...likedCategories])) as number[];

        // 4. おすすめ投稿を取得
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
          .limit(limit);

        // 興味カテゴリがあればフィルター
        if (allCategories.length > 0) {
          query = query.in('category_id', allCategories);
        }

        // 新しい順（興味カテゴリ内で）
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // 5. 結果が少なければ人気投稿で補完
        let allPosts = data || [];

        if (allPosts.length < limit) {
          const existingIds = allPosts.map((p: any) => p.id);

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
            .limit(limit - allPosts.length);

          allPosts = [...allPosts, ...(popular || [])];
        }

        // 6. いいね・応募状態を一括取得
        if (allPosts.length > 0) {
          const postIds = allPosts.map((p: any) => p.id);

          const [likesResult, applicationsResult] = await Promise.all([
            (supabase as any)
              .from('likes')
              .select('post_id')
              .eq('user_id', user.id)
              .in('post_id', postIds),
            (supabase as any)
              .from('applications')
              .select('post_id')
              .eq('applicant_id', user.id)
              .in('post_id', postIds),
          ]);

          const likedIds = new Set(likesResult.data?.map((l: any) => l.post_id) || []);
          const appliedIds = new Set(applicationsResult.data?.map((a: any) => a.post_id) || []);

          // 投稿にステータスを付与
          allPosts = allPosts.map((p: any) => ({
            ...p,
            is_liked: likedIds.has(p.id),
            is_applied: appliedIds.has(p.id),
          }));
        }

        setPosts(allPosts);
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