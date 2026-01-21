'use client';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PostTypeBadge } from '@/components/posts';
import { CategoryBadge } from '@/components/common';
import { usePost, useAuth } from '@/hooks';
import { formatRelativeTime, formatFullDateTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { post, isLoading, error } = usePost(postId);
  const { user, isAuthenticated } = useAuth();

  const isOwner = user?.id === post?.user_id;

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.POST_DETAIL(postId)}`);
      return;
    }
    // TODO: 応募モーダルを開く
    toast.info('応募機能は Phase 3 で実装予定です');
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
          <p className="text-muted-foreground mb-8">
            この投稿は削除されたか、存在しません。
          </p>
          <Button asChild>
            <Link href={ROUTES.EXPLORE}>投稿を探す</Link>
          </Button>
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
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          投稿一覧に戻る
        </Link>

        {/* Main Card */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <PostTypeBadge type={post.type} />
              <CategoryBadge category={post.category} />
              <span className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
                <Eye className="h-4 w-4" />
                {post.view_count}回閲覧
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-6">{post.title}</h1>

            {/* Description */}
            <div className="prose prose-gray max-w-none mb-8">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
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
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{post.location || '場所未定'}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{post.max_applicants}人募集</span>
              </div>
              {post.preferred_schedule && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>{post.preferred_schedule}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {isOwner ? (
                <>
                  <Button asChild>
                    <Link href={ROUTES.POST_EDIT(post.id)}>編集する</Link>
                  </Button>
                  <Button variant="outline">応募を見る</Button>
                </>
              ) : (
                <Button onClick={handleApply} className="flex-1 sm:flex-none">
                  応募する
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Author Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">投稿者</h2>
            <Link
              href={ROUTES.PROFILE_USER(post.profile.username)}
              className="flex items-center gap-4 hover:bg-muted/50 -m-2 p-2 rounded-xl transition-colors"
            >
              <Avatar className="h-14 w-14">
                <AvatarImage src={post.profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg">
                  {post.profile.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.profile.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  @{post.profile.username}
                </p>
                {post.profile.university && (
                  <p className="text-sm text-muted-foreground">
                    {post.profile.university}
                  </p>
                )}
              </div>
            </Link>
            {post.profile.bio && (
              <p className="mt-4 text-sm text-muted-foreground">
                {post.profile.bio}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Timestamp */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          {formatFullDateTime(post.created_at)}に投稿
        </p>
      </div>
    </div>
  );
}
