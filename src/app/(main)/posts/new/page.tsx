'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useCategories } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';
import { PostForm } from '@/components/posts/post-form';
import type { PostFormData } from '@/lib/validations/post';

export default function NewPostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { categories } = useCategories();
  const supabase = getClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);

    try {
      const { data: post, error } = await (supabase as any)
        .from('posts')
        .insert({
          user_id: user?.id,
          type: data.type,
          title: data.title,
          description: data.description,
          category_id: data.categoryId,
          max_applicants: data.maxApplicants,
          is_online: data.isOnline,
          location: data.isOnline === false ? data.location : null,
          status: 'open',
          my_level: data.myLevel,
          target_level_min: data.targetLevelMin,
          target_level_max: data.targetLevelMax,
          tags: data.tags,
          available_days: data.availableDays,
          available_times: data.availableTimes,
          specific_dates: data.specificDates,
          images: data.images,
          deadline_at: data.deadlineAt,  // ← 追加
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('投稿しました！');
      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error('Post error:', error);
      toast.error('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold">新しい投稿</h1>
        <p className="text-gray-500 mt-1">スキルをサポートしたい・チャレンジしたいことを投稿しよう</p>
      </div>

      <PostForm
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}