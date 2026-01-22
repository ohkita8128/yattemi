'use client';

import Link from 'next/link';
import { Heart, MapPin, Monitor, User } from 'lucide-react';
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
    my_level?: number;
    target_level_min?: number;
    target_level_max?: number;
    created_at: string;
    user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
    };
    category?: {
      name: string;
      color: string;
    };
  };
  showAuthor?: boolean;
}

export function PostCard({ post, showAuthor = true }: PostCardProps) {
  const { user } = useAuth();
  const { likesCount, isLiked, toggleLike, isLoading } = useLikes(post.id);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleLike();
  };

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        {/* ヘッダー: タイプ + カテゴリ */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            post.type === 'teach' 
              ? 'bg-purple-100 text-purple-700'
              : 'bg-cyan-100 text-cyan-700'
          }`}>
            {post.type === 'teach' ? '教えたい' : '学びたい'}
          </span>
          
          {post.category && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: `${post.category.color}15`,
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
        {post.my_level !== undefined && (
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
          <span>{formatRelativeTime(post.created_at)}</span>
        </div>

        {/* フッター: 投稿者 + いいね */}
        <div className="flex items-center justify-between pt-3 border-t">
          {showAuthor && post.user ? (
            <Link
              href={`/users/${post.user.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                {post.user.avatar_url ? (
                  <img
                    src={post.user.avatar_url}
                    alt={post.user.display_name}
                    className="h-8 w-8 object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <span className="text-sm font-medium">{post.user.display_name}</span>
            </Link>
          ) : (
            <div />
          )}

          {/* いいねボタン */}
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
