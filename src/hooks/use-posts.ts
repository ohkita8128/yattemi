'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import type { PostWithRelations, Category, PostType } from '@/types';

interface UsePostsOptions {
  type?: PostType | 'all';
  categoryId?: number | null;
  search?: string;
  userId?: string;
  limit?: number;
  includeClosed?: boolean;
}

const PAGE_SIZE = 12;

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const supabaseRef = useRef(getClient());
  const optionsRef = useRef(options);

  // オプションが変わったらリセット
  useEffect(() => {
    const optionsChanged = 
      optionsRef.current.type !== options.type ||
      optionsRef.current.categoryId !== options.categoryId ||
      optionsRef.current.search !== options.search ||
      optionsRef.current.userId !== options.userId ||
      optionsRef.current.includeClosed !== options.includeClosed;

    if (optionsChanged) {
      optionsRef.current = options;
      setPosts([]);
      setPage(0);
      setHasMore(true);
    }
  }, [options.type, options.categoryId, options.search, options.userId, options.includeClosed]);

  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    const supabase = supabaseRef.current;
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let query = (supabase as any)
        .from('posts')
        .select(`
          *,
          profile:profiles(*),
          category:categories(*),
          post_questions(id)
        `)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      // 締め切りを含めない場合（デフォルト）
      if (!options.includeClosed) {
        query = query.eq('status', 'open');
      }

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

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const newPosts = data as PostWithRelations[];
      
      if (append) {
        // 重複を防ぐ
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      } else {
        setPosts(newPosts);
      }

      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('投稿の取得に失敗しました');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [options.type, options.categoryId, options.search, options.userId, options.includeClosed]);

  // 初回 & オプション変更時
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  }, [page, isLoadingMore, hasMore, fetchPosts]);

  const refetch = useCallback(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  return { posts, isLoading, isLoadingMore, error, hasMore, loadMore, refetch };
}

export function usePost(postId: string) {
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef(getClient());
  const hasIncrementedView = useRef(false);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      const supabase = supabaseRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select(`
            *,
            profile:profiles(*),
            category:categories(*),
            post_questions(id)
          `)
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        setPost(data as PostWithRelations);

        // 閲覧数をインクリメント（1回だけ）
        if (!hasIncrementedView.current) {
          hasIncrementedView.current = true;
          await supabase.rpc('increment_view_count', { p_post_id: postId } as any);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('投稿の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return { post, isLoading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabaseRef = useRef(getClient());
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const fetchCategories = async () => {
      const supabase = supabaseRef.current;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data as Category[]);
      }

      hasFetched.current = true;
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, isLoading };
}

export function useCreatePost() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabaseRef = useRef(getClient());

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
    availableDays?: string[];
    availableTimes?: string[];
    specificDates?: { date: string; start: string; end: string }[];
  }) => {
    const supabase = supabaseRef.current;
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('ログインしてください');

      const { data: post, error } = await (supabase as any)
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
          available_days: data.availableDays ?? [],
          available_times: data.availableTimes ?? [],
          specific_dates: data.specificDates ?? [],
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

export function useUpdatePost() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabaseRef = useRef(getClient());

  const updatePost = async (
    postId: string,
    data: {
      title?: string;
      description?: string;
      type?: PostType;
      categoryId?: number;
      maxApplicants?: number;
      location?: string;
      isOnline?: boolean;
      preferredSchedule?: string;
      tags?: string[];
      myLevel?: number;
      targetLevelMin?: number;
      targetLevelMax?: number;
      status?: string;
      availableDays?: string[];
      availableTimes?: string[];
      specificDates?: { date: string; start: string; end: string }[];
    }
  ) => {
    const supabase = supabaseRef.current;
    setIsSubmitting(true);

    try {
      const updateData: any = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
      if (data.maxApplicants !== undefined) updateData.max_applicants = data.maxApplicants;
      if (data.location !== undefined) updateData.location = data.location || null;
      if (data.isOnline !== undefined) updateData.is_online = data.isOnline;
      if (data.preferredSchedule !== undefined) updateData.preferred_schedule = data.preferredSchedule || null;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.myLevel !== undefined) updateData.my_level = data.myLevel;
      if (data.targetLevelMin !== undefined) updateData.target_level_min = data.targetLevelMin;
      if (data.targetLevelMax !== undefined) updateData.target_level_max = data.targetLevelMax;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.availableDays !== undefined) updateData.available_days = data.availableDays;
      if (data.availableTimes !== undefined) updateData.available_times = data.availableTimes;
      if (data.specificDates !== undefined) updateData.specific_dates = data.specificDates;

      const { data: post, error } = await (supabase as any)
        .from('posts')
        .update(updateData as any)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      return post;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updatePost, isSubmitting };
}