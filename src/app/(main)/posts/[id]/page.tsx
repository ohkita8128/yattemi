'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Users,
  Eye,
  Calendar,
  Globe,
  Share2,
  Heart,
  Tag,
  MessageCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PostTypeBadge } from '@/components/posts';
import { CategoryBadge } from '@/components/common';
import { ApplicationDialog } from '@/components/applications';
import { usePost, useAuth } from '@/hooks';
import { useLikes } from '@/hooks/use-likes';
import { formatRelativeTime } from '@/lib/utils';
import { getLevelInfo } from '@/lib/levels';
import { ROUTES } from '@/lib/constants';

const DAYS_LABEL: Record<string, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
};

const TIMES_LABEL: Record<string, string> = {
  morning: '朝', afternoon: '昼', evening: '夜',
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { post, isLoading, error } = usePost(postId);
  const { user, isAuthenticated } = useAuth();
  const { likesCount, isLiked, toggleLike } = useLikes(postId);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  const isOwner = user?.id === post?.user_id;

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN + '?redirect=' + ROUTES.POST_DETAIL(postId));
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

  const handleLike = async () => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    await toggleLike();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full rounded-xl" />
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
          <p className="text-gray-500 mb-8">この投稿は削除されたか、存在しません。</p>
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

  const postAny = post as any;
  const tags: string[] = Array.isArray(postAny.tags) ? postAny.tags : [];
  const availableDays: string[] = Array.isArray(postAny.available_days) ? postAny.available_days : [];
  const availableTimes: string[] = Array.isArray(postAny.available_times) ? postAny.available_times : [];
  const specificDates: { date: string; start: string; end: string }[] = Array.isArray(postAny.specific_dates) ? postAny.specific_dates : [];

  const levelInfo = getLevelInfo(post.my_level ?? 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return (date.getMonth() + 1) + '/' + date.getDate() + '(' + ['日','月','火','水','木','金','土'][date.getDay()] + ')';
  };

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

        {/* Main Card - 統合デザイン */}
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          {/* 投稿者セクション（上部） */}
          <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-pink-50">
            <div className="flex items-center gap-4">
              <Link href={'/users/' + post.profile.username}>
                <div className="h-14 w-14 rounded-full bg-white shadow-md flex items-center justify-center text-xl font-bold overflow-hidden">
                  {post.profile.avatar_url ? (
                    <img
                      src={post.profile.avatar_url}
                      alt={post.profile.display_name}
                      className="h-14 w-14 object-cover"
                    />
                  ) : (
                    <span className="text-orange-500">{post.profile.display_name[0]}</span>
                  )}
                </div>
              </Link>
              <div className="flex-1">
                <Link href={'/users/' + post.profile.username} className="hover:underline">
                  <p className="font-bold text-lg">{post.profile.display_name}</p>
                </Link>
                <p className="text-sm text-gray-500">@{post.profile.username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">{formatRelativeTime(post.created_at)}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
                  <Eye className="h-3 w-3" />
                  {post.view_count}
                </p>
              </div>
            </div>
            {post.profile.bio && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{post.profile.bio}</p>
            )}
          </div>

          {/* 投稿内容セクション */}
          <div className="p-6 md:p-8">
            {/* バッジ */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <PostTypeBadge type={post.type} />
              <CategoryBadge category={post.category} />
              <div className="flex items-center gap-1 ml-auto px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-lg">{levelInfo.emoji}</span>
                <span className="text-sm font-medium">{levelInfo.name}</span>
              </div>
            </div>

            {/* タイトル */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>

            {/* タグ */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 説明 */}
            <div className="mb-6">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* メタ情報 */}
            <div className="grid gap-3 sm:grid-cols-2 mb-6 p-4 bg-gray-50 rounded-xl">
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
            </div>

            {/* 日程 */}
            {(availableDays.length > 0 || availableTimes.length > 0 || specificDates.length > 0) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  希望日程
                </h3>

                {availableDays.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">曜日:</span>
                    <div className="flex gap-1">
                      {availableDays.map((day) => (
                        <span
                          key={day}
                          className={'px-2 py-1 rounded text-xs font-medium ' +
                            (day === 'sat' ? 'bg-blue-100 text-blue-700' :
                             day === 'sun' ? 'bg-red-100 text-red-700' :
                             'bg-gray-100 text-gray-700')}
                        >
                          {DAYS_LABEL[day] || day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {availableTimes.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">時間帯:</span>
                    <div className="flex gap-1">
                      {availableTimes.map((time) => (
                        <span
                          key={time}
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                        >
                          {TIMES_LABEL[time] || time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {specificDates.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 block mb-2">具体的な日時候補:</span>
                    <div className="space-y-1">
                      {specificDates.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">📅</span>
                          <span className="font-medium">{formatDate(item.date)}</span>
                          <span className="text-gray-500">{item.start} 〜 {item.end}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* アクションバー（下部固定風） */}
          <div className="p-4 border-t bg-gray-50 flex items-center gap-3">
            {isOwner ? (
              <>
                <Link
                  href={'/posts/' + post.id + '/edit'}
                  className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 flex items-center justify-center"
                >
                  編集する
                </Link>
                <Link
                  href="/applications"
                  className="flex-1 h-12 rounded-xl border-2 font-medium hover:bg-white flex items-center justify-center"
                >
                  応募を見る
                </Link>
              </>
            ) : (
              <button
                onClick={handleApply}
                className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                応募する
              </button>
            )}

            <button
              onClick={handleLike}
              className={'h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-colors ' +
                (isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'hover:bg-gray-100')}
            >
              <Heart className={'h-5 w-5 ' + (isLiked ? 'fill-current' : '')} />
            </button>
            <span className="text-sm text-gray-500">{likesCount}</span>

            <button
              onClick={handleShare}
              className="h-12 w-12 rounded-xl border-2 hover:bg-gray-100 flex items-center justify-center"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Application Dialog */}
      <ApplicationDialog
        postId={post.id}
        postTitle={post.title}
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
