'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

// バッジの定義（先輩用・後輩用・共通）
export const SENPAI_BADGES = {
  clear: { emoji: '🎓', label: 'わかりやすい！' },
  helpful: { emoji: '💡', label: 'ためになった！' },
  godsenpai: { emoji: '🌟', label: '神先輩！' },
} as const;

export const KOUHAI_BADGES = {
  eager: { emoji: '🔥', label: '熱心だった！' },
  quicklearner: { emoji: '✨', label: 'のみこみ早い！' },
  hardworker: { emoji: '💪', label: 'がんばり屋！' },
} as const;

export const COMMON_BADGES = {
  awesome: { emoji: '👏', label: '最高だった！' },
  thanks: { emoji: '💖', label: 'ありがとう！' },
  again: { emoji: '🤝', label: 'また会いたい！' },
} as const;

// 先輩に送るバッジ（後輩が選ぶ）
export const BADGES_FOR_SENPAI = { ...SENPAI_BADGES, ...COMMON_BADGES };

// 後輩に送るバッジ（先輩が選ぶ）
export const BADGES_FOR_KOUHAI = { ...KOUHAI_BADGES, ...COMMON_BADGES };

// 全バッジ
export const ALL_BADGES = { ...SENPAI_BADGES, ...KOUHAI_BADGES, ...COMMON_BADGES };

export type SenpaiBadgeKey = keyof typeof SENPAI_BADGES;
export type KouhaiBadgeKey = keyof typeof KOUHAI_BADGES;
export type CommonBadgeKey = keyof typeof COMMON_BADGES;
export type BadgeKey = keyof typeof ALL_BADGES;

export type ReviewerRole = 'senpai' | 'kouhai';

export interface Review {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_role: ReviewerRole;
  badges: BadgeKey[];
  comment: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface UserStats {
  teach_count: number;
  challenge_count: number;
  // 先輩としてもらったバッジ
  senpai_badge_clear: number;
  senpai_badge_helpful: number;
  senpai_badge_godsenpai: number;
  // 後輩としてもらったバッジ
  kouhai_badge_eager: number;
  kouhai_badge_quicklearner: number;
  kouhai_badge_hardworker: number;
  // 共通バッジ
  badge_awesome: number;
  badge_thanks: number;
  badge_again: number;
}

// レビューを取得
export function useReviews(matchId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = getClient();

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(id, username, display_name, avatar_url)
        `)
        .eq('match_id', matchId);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, supabase]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const hasReviewed = reviews.some(r => r.reviewer_id === user?.id);

  return { reviews, isLoading, hasReviewed, refetch: fetchReviews };
}

// レビューを作成
export function useCreateReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const supabase = getClient();

  const createReview = async (
    matchId: string,
    revieweeId: string,
    reviewerRole: ReviewerRole,
    badges: BadgeKey[],
    comment?: string
  ) => {
    if (!user) throw new Error('認証が必要です');
    if (badges.length > 3) throw new Error('バッジは3つまで選択できます');

    setIsSubmitting(true);
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .insert({
          match_id: matchId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          reviewer_role: reviewerRole,
          badges,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createReview, isSubmitting };
}

// ユーザーの統計を取得
export function useUserStats(userId: string | undefined) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .rpc('get_user_stats', { target_user_id: userId });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setStats(data[0]);
        } else {
          setStats(getDefaultStats());
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setStats(getDefaultStats());
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId, supabase]);

  return { stats, isLoading };
}

// デフォルト統計
function getDefaultStats(): UserStats {
  return {
    teach_count: 0,
    challenge_count: 0,
    senpai_badge_clear: 0,
    senpai_badge_helpful: 0,
    senpai_badge_godsenpai: 0,
    kouhai_badge_eager: 0,
    kouhai_badge_quicklearner: 0,
    kouhai_badge_hardworker: 0,
    badge_awesome: 0,
    badge_thanks: 0,
    badge_again: 0,
  };
}

// 先輩からもらったレビュー一覧
export function useReviewsFromSenpai(userId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('reviews')
          .select(`
            *,
            reviewer:profiles!reviewer_id(id, username, display_name, avatar_url)
          `)
          .eq('reviewee_id', userId)
          .eq('reviewer_role', 'senpai')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews from senpai:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [userId, supabase]);

  return { reviews, isLoading };
}

// 後輩からもらったレビュー一覧
export function useReviewsFromKouhai(userId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('reviews')
          .select(`
            *,
            reviewer:profiles!reviewer_id(id, username, display_name, avatar_url)
          `)
          .eq('reviewee_id', userId)
          .eq('reviewer_role', 'kouhai')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews from kouhai:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [userId, supabase]);

  return { reviews, isLoading };
}
