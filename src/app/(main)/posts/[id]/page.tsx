'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Eye,
  Calendar,
  Globe,
  Share2,
  Flag,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PostTypeBadge } from '@/components/posts';
import { CategoryBadge } from '@/components/common';
import { ApplicationDialog } from '@/components/applications';
import { usePost, useAuth } from '@/hooks';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { post, isLoading, error } = usePost(postId);
  const { user, isAuthenticated } = useAuth();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  const isOwner = user?.id === post?.user_id;

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.POST_DETAIL(postId)}`);
      return;
    }
    setIsApplyDialogOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('リンクをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">投稿が見つかりません</h1>
          <p className="text-gray-500 mb-8">
            この投稿は削除されたか、存在しません。
          </p>
          <Link
            href={ROUTES.EXPLORE}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            投稿を探す
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          投稿一覧に戻る
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 md:p-8 mb-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <PostTypeBadge type={post.type} />
            <CategoryBadge category={post.category} />
            <span className="text-sm text-gray-500 flex items-center gap-1 ml-auto">
              <Eye className="h-4 w-4" />
              {post.view_count}回閲覧
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mb-6">{post.title}</h1>

          {/* Description */}
          <div className="mb-8">
            <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Meta Info */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="flex items-center gap-3 text-sm">
              {post.is_online ? (
                <>
                  <Globe className="h-5 w-5 text-green-500" />
                  <span>オンライン対応</span>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{post.location || '場所未定'}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-5 w-5 text-gray-400" />
              <span>{post.max_applicants}人募集</span>
            </div>
            {post.preferred_schedule && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{post.preferred_schedule}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
                >
                  編集する
                </Link>
                <Link
                  href="/applications"
                  className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-2 font-medium hover:bg-gray-50"
                >
                  応募を見る
                </Link>
              </>
            ) : (
              <button
                onClick={handleApply}
                className="flex-1 sm:flex-none inline-flex items-center justify-center h-10 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
              >
                応募する
              </button>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-2 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-gray-50">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Author Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h2 className="font-semibold mb-4">投稿者</h2>
          <Link
            href={`/profile/${post.profile.username}`}
            className="flex items-center gap-4 hover:bg-gray-50 -m-2 p-2 rounded-xl transition-colors"
          >
            <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-medium">
              {post.profile.avatar_url ? (
                <img
                  src={post.profile.avatar_url}
                  alt={post.profile.display_name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                post.profile.display_name[0]
              )}
            </div>
            <div>
              <p className="font-semibold">{post.profile.display_name}</p>
              <p className="text-sm text-gray-500">@{post.profile.username}</p>
            </div>
          </Link>
          {post.profile.bio && (
            <p className="mt-4 text-sm text-gray-500">{post.profile.bio}</p>
          )}
        </div>
      </div>

      {/* Application Dialog */}
      <ApplicationDialog
        postId={post.id}
        postTitle={post.title}
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
        onSuccess={() => {
          // 成功時の処理
        }}
      />
    </div>
  );
}
