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
  MessageCircle,
  Clock,
  Edit,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationDialog } from '@/components/applications';
import { usePost, useAuth } from '@/hooks';
import { useLikes } from '@/hooks/use-likes';
import { formatRelativeTime } from '@/lib/utils';
import { getLevelEmoji } from '@/lib/levels';
import { ROUTES, POST_TYPES } from '@/lib/constants';
import { PostQuestions } from '@/components/posts/post-questions';

const DAYS_LABEL: Record<string, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
};

const TIMES_LABEL: Record<string, string> = {
  morning: '午前', afternoon: '午後', evening: '夜',
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { post, isLoading, error } = usePost(postId);
  const { user, isAuthenticated } = useAuth();
  const { likesCount, isLiked, toggleLike } = useLikes(postId);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-6 w-24 mb-6" />
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16">
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
  const images: string[] = Array.isArray(postAny.images) ? postAny.images : [];
  const availableDays: string[] = Array.isArray(postAny.available_days) ? postAny.available_days : [];
  const availableTimes: string[] = Array.isArray(postAny.available_times) ? postAny.available_times : [];
  const specificDates: { date: string; start: string; end: string }[] = Array.isArray(postAny.specific_dates) ? postAny.specific_dates : [];

  const myLevel = post.my_level ?? 5;
  const targetMin = postAny.target_level_min ?? 0;
  const targetMax = postAny.target_level_max ?? 10;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}(${['日','月','火','水','木','金','土'][date.getDay()]})`;
  };

  const formatSchedule = () => {
    const parts: string[] = [];
    if (availableDays.length > 0) {
      parts.push(availableDays.map(d => DAYS_LABEL[d]).join(''));
    }
    if (availableTimes.length > 0) {
      parts.push(availableTimes.map(t => TIMES_LABEL[t]).join('/'));
    }
    return parts.join('・');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="h-14 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold">投稿</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl py-4">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Author Section */}
          <div className="p-4 flex items-start gap-3">
            <Link href={`/users/${post.profile.username}`}>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                {post.profile.avatar_url ? (
                  <img
                    src={post.profile.avatar_url}
                    alt={post.profile.display_name}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  post.profile.display_name[0]
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/users/${post.profile.username}`} className="hover:underline">
                  <span className="font-bold truncate">{post.profile.display_name}</span>
                </Link>
                <span className="text-gray-400 text-sm">@{post.profile.username}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-0.5">
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.view_count}
                </span>
              </div>
            </div>
            {isOwner && (
              <Link
                href={`/posts/${post.id}/edit`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Edit className="h-5 w-5 text-gray-500" />
              </Link>
            )}
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                post.type === 'teach' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-cyan-100 text-cyan-700'
              }`}>
                {POST_TYPES[post.type].emoji} {POST_TYPES[post.type].label}
              </span>
              <span 
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: post.category.color + '20',
                  color: post.category.color 
                }}
              >
                {post.category.name}
              </span>
              {post.status === 'closed' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
                  締め切り
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold mb-2">{post.title}</h1>

            {/* Description */}
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
              {post.description}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-orange-500 hover:underline cursor-pointer text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="px-4 pb-4">
              <div className={`rounded-xl overflow-hidden border ${
                images.length === 1 ? '' : 'grid gap-0.5 ' + (images.length === 2 ? 'grid-cols-2' : 'grid-cols-2')
              }`}>
                {images.length === 1 ? (
                  <img 
                    src={images[0]} 
                    alt="" 
                    className="w-full max-h-[350px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setSelectedImage(images[0] || null)}
                  />
                ) : (
                  images.slice(0, 4).map((url, index) => (
                    <div 
                      key={index}
                      className={`relative overflow-hidden ${
                        images.length === 3 && index === 0 ? 'row-span-2' : ''
                      }`}
                    >
                      <img 
                        src={url} 
                        alt="" 
                        className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                          images.length === 3 && index === 0 ? 'h-full' : 'h-[150px]'
                        }`}
                        onClick={() => setSelectedImage(url || null)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="px-4 pb-4 space-y-3">
            {/* Level & Format */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span>{getLevelEmoji(myLevel)}</span>
                <span className="text-gray-600">
                  {post.type === 'teach' ? '教える側のレベル' : '現在のレベル'}
                </span>
              </div>
              {post.type === 'teach' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <span>{getLevelEmoji(targetMin)}→{getLevelEmoji(targetMax)}</span>
                  <span className="text-gray-600">募集レベル</span>
                </div>
              )}
            </div>

            {/* Location & Capacity */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                {post.is_online === true ? (
                  <>
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>オンライン</span>
                  </>
                ) : post.is_online === false ? (
                  <>
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{post.location || '対面'}</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>どちらでもOK</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{post.max_applicants}人募集</span>
              </div>
            </div>

            {/* Schedule */}
            {(availableDays.length > 0 || availableTimes.length > 0) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700">{formatSchedule()}</span>
              </div>
            )}

            {/* Specific Dates */}
            {specificDates.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  日時候補
                </p>
                <div className="space-y-1">
                  {specificDates.map((item, i) => (
                    <div key={i} className="text-sm text-green-600">
                      {formatDate(item.date)} {item.start}〜{item.end}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likesCount}</span>
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {isOwner ? (
              <Link
                href="/applications"
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                応募を見る
              </Link>
            ) : (
              <button
                onClick={handleApply}
                disabled={post.status === 'closed'}
                className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                応募する
              </button>
            )}
          </div>
        </div>
      </div>
      <PostQuestions
        postId={post.id}
        postOwnerId={post.user_id}
        currentUserId={user?.id || null}
        isClosed={post.status === 'closed'}
      />
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

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