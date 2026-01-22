'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import type { PostWithRelations, Category, PostType } from '@/types';

interface UsePostsOptions {
  type?: PostType | 'all';
  categoryId?: number | null;
  search?: string;
  userId?: string;
  limit?: number;
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getClient();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(*),
          category:categories(*)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (options.type && options.type !== 'all') {
        query = query.eq('type', options.type);
      }

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPosts(data as PostWithRelations[]);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('投稿の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, options.type, options.categoryId, options.search, options.userId, options.limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function usePost(postId: string) {
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getClient();

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select(`
            *,
            profile:profiles(*),
            category:categories(*)
          `)
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        setPost(data as PostWithRelations);

        // 閲覧数をインクリメント
        await supabase.rpc('increment_view_count', { p_post_id: postId } as any);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('投稿の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [supabase, postId]);

  return { post, isLoading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getClient();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data as Category[]);
      }
      setIsLoading(false);
    };

    fetchCategories();
  }, [supabase]);

  return { categories, isLoading };
}

export function useCreatePost() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = getClient();

  const createPost = async (data: {
    title: string;
    description: string;
    type: PostType;
    categoryId: number;
    maxApplicants: number;
    location?: string;
    isOnline: boolean;
    preferredSchedule?: string;
    tags: string[];
    myLevel?: number;
    targetLevelMin?: number;
    targetLevelMax?: number;
  }) => {
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('ログインしてください');

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: userData.user.id,
          title: data.title,
          description: data.description,
          type: data.type,
          category_id: data.categoryId,
          max_applicants: data.maxApplicants,
          location: data.location || null,
          is_online: data.isOnline,
          preferred_schedule: data.preferredSchedule || null,
          tags: data.tags,
          status: 'open',
          my_level: data.myLevel ?? 5,
          target_level_min: data.targetLevelMin ?? 0,
          target_level_max: data.targetLevelMax ?? 10,
        } as any)
        .select()
        .single();

      if (error) throw error;

      return post;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createPost, isSubmitting };
}
