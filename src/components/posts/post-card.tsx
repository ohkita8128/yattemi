'use client';

import Link from 'next/link';
import { Heart, MapPin, Monitor, Video } from 'lucide-react';
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
    type: 'teach' | 'learn';
    is_online?: boolean | null;
    location?: string | null;
    my_level?: number | null;
    target_level_min?: number | null;
    target_level_max?: number | null;
    available_days?: string[] | null;
    available_times?: string[] | null;
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
    if (post.type === 'teach') {
      // 教えたい: 自分のレベル → 対象レベル
      if (post.my_level != null && post.target_level_min != null) {
        return `${getLevelEmoji(post.my_level)}→${getLevelEmoji(post.target_level_min)}`;
      }
      if (post.my_level != null) {
        return getLevelEmoji(post.my_level);
      }
    } else {
      // 学びたい: 自分のレベル
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
        "block bg-white rounded-xl border hover:bg-gray-50 transition-colors relative",
        isClosed && "opacity-60"
      )}
    >
      <div className="p-4">
        {/* バッジ（締め切り / 応募済み） */}
        {(isClosed || isApplied) && (
          <div className="absolute top-3 right-3 z-10">
            {isClosed ? (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                締め切り
              </span>
            ) : isApplied ? (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">
                ✓ 応募済み
              </span>
            ) : null}
          </div>
        )}

        {/* ヘッダー: アバター + 名前 + 時間 */}
        {showAuthor && author && (
          <div className="flex items-start gap-3">
            {/* アバター */}
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

            {/* コンテンツエリア */}
            <div className="flex-1 min-w-0">
              {/* 名前 + ユーザー名 + 時間 */}
              <div className="flex items-center gap-1 text-sm">
                <span className="font-semibold truncate">{author.display_name}</span>
                <span className="text-gray-400 truncate">@{author.username}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>

              {/* タイプ + カテゴリ */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    post.type === 'teach'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-cyan-100 text-cyan-700'
                  )}
                >
                  {post.type === 'teach' ? '🎓 教えたい' : '📚 学びたい'}
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
              </div>

              {/* タイトル */}
              <h3 className="font-semibold text-base mt-2 line-clamp-2">
                {post.title}
              </h3>

              {/* 説明 */}
              {post.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {post.description}
                </p>
              )}

              {/* メタ情報 + いいね */}
              <div className="flex items-center justify-between mt-3">
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
        )}

        {/* showAuthor = false の場合（シンプル版） */}
        {!showAuthor && (
          <div>
            {/* タイプ + カテゴリ + 時間 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    post.type === 'teach'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-cyan-100 text-cyan-700'
                  )}
                >
                  {post.type === 'teach' ? '🎓 教えたい' : '📚 学びたい'}
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
              </div>
              <span className="text-gray-400 text-xs">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            {/* タイトル */}
            <h3 className="font-semibold text-base mt-2 line-clamp-2">
              {post.title}
            </h3>

            {/* 説明 */}
            {post.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {post.description}
              </p>
            )}

            {/* メタ情報 + いいね */}
            <div className="flex items-center justify-between mt-3">
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
        )}
      </div>
    </Link>
  );
}
