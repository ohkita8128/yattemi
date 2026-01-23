'use client';

import Link from 'next/link';
import { Heart, MapPin, Monitor } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { useAuth } from '@/hooks';
import { getLevelLabel } from '@/lib/levels';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    description?: string;
    type: 'teach' | 'learn';
    is_online?: boolean;
    location?: string | null;
    my_level?: number | null;
    target_level_min?: number | null;
    target_level_max?: number | null;
    created_at: string;
    status?: string;
    profile?: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url?: string | null;
    };
    user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string | null;
    };
    profiles?: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url?: string | null;
    };
    category?: {
      name: string;
      color: string;
    };
  };
  showAuthor?: boolean;
  isApplied?: boolean;
}

export function PostCard({ post, showAuthor = true, isApplied = false }: PostCardProps) {
  const { user } = useAuth();
  const { likesCount, isLiked, toggleLike, isLoading } = useLikes(post.id);

  // profile または user から投稿者情報を取得
  const author = post.profile || post.user || post.profiles;

  // 締め切り判定
  const isClosed = post.status === 'closed';

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleLike();
  };

  return (
    <Link
      href={'/posts/' + post.id}
      className={cn(
        "block bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
        isClosed && "opacity-70"
      )}
    >
      {/* 締め切りバッジ（左上） */}
      {isClosed && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-sm">
            締め切り
          </span>
        </div>
      )}

      {/* 応募済みバッジ（右上） */}
      {isApplied && !isClosed && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-green-500 text-white shadow-sm">
            ✓ 応募済み
          </span>
        </div>
      )}

      <div className={cn("p-5", isClosed && "pt-12")}>
        {/* 投稿者（上部に表示） */}
        {showAuthor && author && (
          <div className={cn(
            "flex items-center gap-3 mb-4 pb-3 border-b",
            !isClosed && isApplied && "pt-6"
          )}>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.display_name || 'ユーザー'}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                <span className="text-orange-600 font-medium">
                  {(author.display_name || 'U')[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{author.display_name}</p>
              <p className="text-xs text-gray-400">@{author.username}</p>
            </div>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        )}

        {/* ヘッダー: タイプ + カテゴリ */}
        <div className={cn(
          "flex items-center gap-2 mb-3 flex-wrap",
          !showAuthor && (isClosed || isApplied) && "pt-6"
        )}>
          <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' +
            (post.type === 'teach'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-cyan-100 text-cyan-700')}>
            {post.type === 'teach' ? '🎓 教えたい' : '📚 学びたい'}
          </span>

          {post.category && (
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: post.category.color + '15',
                color: post.category.color
              }}
            >
              {post.category.name}
            </span>
          )}
        </div>

        {/* タイトル */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>

        {/* 説明 */}
        {post.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {post.description}
          </p>
        )}

        {/* レベル表示 */}
        {post.my_level != null && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-gray-500">
              {post.type === 'teach' ? '先輩レベル:' : '現在:'}
            </span>
            <span className="font-medium">{getLevelLabel(post.my_level)}</span>
          </div>
        )}

        {/* メタ情報 */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            {post.is_online ? (
              <>
                <Monitor className="h-3 w-3" />
                オンライン
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3" />
                {post.location || '対面'}
              </>
            )}
          </span>
          {!showAuthor && (
            <span>{formatRelativeTime(post.created_at)}</span>
          )}
        </div>

        {/* フッター: いいね */}
        <div className="flex items-center justify-end pt-3 border-t">
          <button
            onClick={handleLikeClick}
            disabled={!user || isLoading}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
              isLiked
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100',
              !user && 'cursor-not-allowed opacity-50'
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            <span>{likesCount}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
