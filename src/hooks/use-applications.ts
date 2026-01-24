'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';

interface ApplicationWithRelations {
  id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  post: {
    id: string;
    title: string;
    type: 'support' | 'challenge';
  };
  applicant: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// 自分が応募したもの一覧
export function useMyApplications() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          post:posts(id, title, type),
          applicant:profiles!applicant_id(id, username, display_name, avatar_url)
        `)
        .eq('applicant_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as any) || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, isLoading, refetch: fetchApplications };
}

// 自分の投稿への応募一覧
export function useReceivedApplications() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          post:posts!inner(id, title, type, user_id),
          applicant:profiles!applicant_id(id, username, display_name, avatar_url)
        `)
        .eq('post.user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data as any) || []);
    } catch (error) {
      console.error('Error fetching received applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, isLoading, refetch: fetchApplications };
}

// 応募を作成
export function useCreateApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = getClient();

  const createApplication = async (postId: string, message: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('ログインしてください');

      const { data, error } = await supabase
        .from('applications')
        .insert({
          post_id: postId,
          applicant_id: session.user.id,
          message: message,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createApplication, isSubmitting };
}

// 応募ステータスを更新
export function useUpdateApplicationStatus() {
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = getClient();

  const updateStatus = async (applicationId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // 承認時はマッチングを作成
      if (status === 'accepted') {
        await (supabase as any)
          .from('matches')
          .insert({ application_id: applicationId });
      }
    } finally {
      setIsUpdating(false);
    }
  };
  return { updateStatus, isUpdating };
}