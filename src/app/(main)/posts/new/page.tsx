'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PostForm } from '@/components/posts';
import { useCategories, useCreatePost, useAuth } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import type { PostFormData } from '@/lib/validations/post';
import type { PostType } from '@/types';

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') as PostType) || 'teach';

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createPost, isSubmitting } = useCreatePost();

  if (!authLoading && !isAuthenticated) {
    router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.POST_NEW}`);
    return null;
  }

  const handleSubmit = async (data: PostFormData) => {
    try {
      const post = await createPost(data) as { id: string };
      toast.success('投稿しました！');
      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('投稿に失敗しました');
    }
  };

  if (authLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h1 className="text-2xl font-bold mb-6">新しい投稿を作成</h1>
          <PostForm
            categories={categories}
            defaultType={defaultType}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <NewPostForm />
    </Suspense>
  );
}