'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostForm } from '@/components/posts';
import { useCategories, useCreatePost, useAuth } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import type { PostFormData } from '@/lib/validations/post';
import type { PostType } from '@/types';

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') as PostType) || 'teach';

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createPost, isSubmitting } = useCreatePost();

  // ログインしていない場合はログインページへ
  if (!authLoading && !isAuthenticated) {
    router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.POST_NEW}`);
    return null;
  }

  const handleSubmit = async (data: PostFormData) => {
    try {
      const post = await createPost(data);
      toast.success('投稿しました！');
      //@ts-ignore
      router.push(ROUTES.POST_DETAIL(post.id));
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
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">新しい投稿を作成</CardTitle>
          </CardHeader>
          <CardContent>
            <PostForm
              categories={categories}
              defaultType={defaultType}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
