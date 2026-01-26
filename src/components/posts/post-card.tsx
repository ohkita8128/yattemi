'use client';

import Link from 'next/link';
import { Heart, MapPin, Monitor, Video, MessageCircle } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { useAuth } from '@/hooks';
import { getLevelEmoji } from '@/lib/levels';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// 曜日の変換マップ
const DAY_LABELS: Record<string, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

// 時間帯の変換マップ
const TIME_LABELS: Record<string, string> = {
  morning: '午前',
  afternoon: '午後',
  evening: '夜',
};

interface PostCardProps {
  post: {
    id: string;
    title: string;
    description?: string;
    type: 'support' | 'challenge';
    is_online?: boolean | null;
    location?: string | null;
    my_level?: number | null;
    target_level_min?: number | null;
    target_level_max?: number | null;
    post_questions?: { id: string }[] | null;
    questions_count?: number | null;
    likes_count?: number | null;
    available_days?: string[] | null;
    available_times?: string[] | null;
    tags?: string[] | null;
    images?: string[] | null;
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
  const { likesCount, isLiked, toggleLike, isLoading } = useLikes(post.id, post.likes_count ?? undefined);

  // profile または user から投稿者情報を取得
  const author = post.profile || post.user || post.profiles;

  // 締め切り判定
  const isClosed = post.status === 'closed';

  // 日程を整形
  const formatSchedule = () => {
    const parts: string[] = [];
    
    if (post.available_days && post.available_days.length > 0) {
      const days = post.available_days
        .map(d => DAY_LABELS[d] || d)
        .join('');
      parts.push(days);
    }
    
    if (post.available_times && post.available_times.length > 0) {
      const times = post.available_times
        .map(t => TIME_LABELS[t] || t)
        .join('/');
      parts.push(times);
    }
    
    return parts.length > 0 ? parts.join('・') : null;
  };

  // レベル表示を整形（絵文字のみ）
  const formatLevel = () => {
    if (post.type === 'support') {
      if (post.my_level != null && post.target_level_min != null) {
        return `${getLevelEmoji(post.my_level)}→${getLevelEmoji(post.target_level_min)}`;
      }
      if (post.my_level != null) {
        return getLevelEmoji(post.my_level);
      }
    } else {
      if (post.my_level != null) {
        return getLevelEmoji(post.my_level);
      }
    }
    return null;
  };

  // 形式表示
  const formatStyle = () => {
    if (post.is_online === true) return { icon: Monitor, text: 'オンライン' };
    if (post.is_online === false) return { icon: MapPin, text: post.location || '対面' };
    return { icon: Video, text: 'どちらでもOK' };
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleLike();
  };

  const schedule = formatSchedule();
  const level = formatLevel();
  const style = formatStyle();
  const StyleIcon = style.icon;

  return (
    <Link
      href={'/posts/' + post.id}
      className={cn(
        "block bg-white rounded-md border hover:bg-gray-50 transition-colors",
        isClosed && "opacity-60"
      )}
    >
      {/* ヘッダー */}
      {showAuthor && author && (
        <div className="px-3 py-2 border-b">
          {/* 1行目: アバター + 名前 + 時間 */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <div className="flex items-center gap-1 text-sm">
                <span className="font-semibold truncate">{author.display_name}</span>
                <span className="text-gray-400 truncate">@{author.username}</span>
              </div>
            </div>
            <span className="text-gray-400 text-xs flex-shrink-0">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          {/* 2行目: タイプ + カテゴリ + 締め切り/応募済み */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                post.type === 'support'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              )}
            >
              {post.type === 'support' ? '🎓 サポートしたい' : '📚 チャレンジしたい'}
            </span>

            {post.category && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: post.category.color + '20',
                  color: post.category.color,
                }}
              >
                {post.category.name}
              </span>
            )}

            {isClosed && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-500 text-white">
                締め切り
              </span>
            )}

            {isApplied && !isClosed && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-500 text-white">
                ✓ 応募済み
              </span>
            )}
          </div>
        </div>
      )}

      {/* showAuthor = false の場合のヘッダー */}
      {!showAuthor && (
        <div className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  post.type === 'support'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                )}
              >
                {post.type === 'support' ? '🎓 サポートしたい' : '📚 チャレンジしたい'}
              </span>

              {post.category && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: post.category.color + '20',
                    color: post.category.color,
                  }}
                >
                  {post.category.name}
                </span>
              )}

              {isClosed && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-500 text-white">
                  締め切り
                </span>
              )}

              {isApplied && !isClosed && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-500 text-white">
                  ✓ 応募済み
                </span>
              )}
            </div>
            <span className="text-gray-400 text-xs">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
      )}

      {/* 本文 */}
      <div className="px-3 py-2">
        {/* タイトル */}
        <h3 className="font-semibold text-base line-clamp-2">
          {post.title}
        </h3>

        {/* 説明 */}
        {post.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* タグ */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 5 && (
              <span className="text-xs text-gray-400">
                +{post.tags.length - 5}
              </span>
            )}
          </div>
        )}

        {/* 画像 */}
        {post.images && post.images.length > 0 && (
          <div className="mt-2 rounded-md overflow-hidden max-h-[180px]">
            {post.images.length === 1 ? (
              <img src={post.images[0]} alt="" className="w-full h-full max-h-[180px] object-cover" />
            ) : (
              <div className={`grid gap-0.5 h-[180px] ${
                post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
              }`}>
                {post.images.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden ${
                      post.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* メタ情報 + いいね */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          {/* 左側: レベル、日程、形式 */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {level && (
              <span className="font-medium">{level}</span>
            )}
            {schedule && (
              <span>📅 {schedule}</span>
            )}
            <span className="flex items-center gap-0.5">
              <StyleIcon className="h-3 w-3" />
              {style.text}
            </span>
          </div>
          {/* 右側: 質問数 + いいね */}
          <div className="flex items-center gap-3">
              {/* 質問数 */}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span>{post.questions_count || 0}</span>
              </span>


            {/* 右側: いいね */}
            <button
              onClick={handleLikeClick}
              disabled={!user || isLoading}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-red-400',
                !user && 'cursor-not-allowed opacity-50'
              )}
            >
              <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
              <span>{likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
