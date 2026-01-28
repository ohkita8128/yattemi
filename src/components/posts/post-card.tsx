'use client';

import Link from 'next/link';
import { Heart, MapPin, Monitor, Video, MessageCircle } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { useAuth } from '@/hooks';
import { getLevelEmoji } from '@/lib/levels';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

// 残り日数を計算（7日以内のみ表示）
function getDeadlineDisplay(deadlineAt: string | null | undefined): {
  text: string;
  className: string;
} | null {
  if (!deadlineAt) return null;

  const now = new Date();
  const deadline = new Date(deadlineAt);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays > 7) return null;

  if (diffDays === 0) {
    return { text: '今日まで', className: 'text-red-500' };
  } else if (diffDays <= 3) {
    return { text: `あと${diffDays}日`, className: 'text-orange-500' };
  } else {
    return { text: `あと${diffDays}日`, className: 'text-gray-400' };
  }
}

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
    deadline_at?: string | null;
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
  isLiked?: boolean;
}

export function PostCard({ post, showAuthor = true, isApplied = false, isLiked: initialIsLiked }: PostCardProps) {
  const { user } = useAuth();
  const { likesCount, isLiked, toggleLike, isLoading } = useLikes(
    post.id,
    post.likes_count ?? undefined,
    initialIsLiked  // ← 追加
  );

  // profile または user から投稿者情報を取得
  const author = post.profile || post.user || post.profiles;

  // 締め切り判定
  const isClosed = post.status === 'closed';
  // 残り日数（追加）
  const deadlineDisplay = !isClosed ? getDeadlineDisplay(post.deadline_at) : null;

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
        "block bg-white rounded-md border hover:bg-gray-50 transition-colors overflow-hidden h-full flex flex-col",
        isClosed && "opacity-60"
      )}
    >
      {/* ヘッダー */}
      {showAuthor && author && (
        <div className="px-3 py-2 border-b">
          {/* ヘッダー: アバター + 2行 */}
          <div className="flex items-start gap-2.5">
            {/* アバター（小さく） */}
            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {author.avatar_url ? (
                // ✅ 修正
                <Image
                  src={author.avatar_url}
                  alt={author.display_name || 'ユーザー'}
                  width={72}
                  height={72}
                  className="h-9 w-9 object-cover"
                />
              ) : (
                <span className="text-orange-600 font-medium text-sm">
                  {(author.display_name || 'U')[0]}
                </span>
              )}
            </div>

            {/* 右側: 2行 */}
            <div className="flex-1 min-w-0">
              {/* 1行目: 名前 + 時間 */}
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-semibold truncate">{author.display_name}</span>
                <span className="text-gray-400 text-xs truncate">@{author.username}</span>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-auto">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>

              {/* 2行目: タイプ + カテゴリ + バッジ */}
              <div className="flex items-center justify-between mt-1">
                {/* 左: タイプ + カテゴリ */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs font-medium',
                      post.type === 'support'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    )}
                  >
                    {post.type === 'support' ? '🎓 サポート' : '📚 チャレンジ'}
                  </span>

                  {post.category && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: post.category.color + '20',
                        color: post.category.color,
                      }}
                    >
                      {post.category.name}
                    </span>
                  )}
                </div>

                {/* 右: ステータスバッジ */}
                <div className="flex items-center gap-1.5">
                  {isClosed && (
                    <span className="px-1.5 py-0.5 rounded-md text-xs font-bold bg-red-500 text-white">
                      締切
                    </span>
                  )}

                  {isApplied && !isClosed && (
                    <span className="px-1.5 py-0.5 rounded-md text-xs font-bold bg-green-500 text-white">
                      ✓ 応募済
                    </span>
                  )}
                </div>
              </div>
            </div>
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
      <div className="px-3 py-2 overflow-hidden min-w-0 flex-1">
        {/* タイトル */}
        <h3 className="font-semibold text-base line-clamp-2">
          {post.title}
        </h3>

        {/* 説明 */}
        {post.description && (
          <p className={cn(
            "text-sm text-gray-600 mt-1 whitespace-pre-line",
            post.images && post.images.length > 0 ? "line-clamp-3" : "line-clamp-12"
          )}>
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
        {post.images && post.images.length > 0 && post.images[0] && (
          <div className="mt-2">
            {post.images.length === 1 ? (
              <div className="rounded-md overflow-hidden aspect-[3/2] relative">
                <Image
                  src={post.images[0]}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={cn(
                "grid gap-1 rounded-md overflow-hidden",
                post.images.length === 2 ? "grid-cols-2 aspect-[3/1]" : "grid-cols-2 grid-rows-2 aspect-[4/3]"
              )}>
                {post.images.slice(0, 4).map((url, index) => (
                  url && (
                    <div key={index} className="relative overflow-hidden">
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* メタ情報 + いいね（本文の外に出す） */}
      <div className="px-3 py-2 border-t flex items-center justify-between">
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
        {/* 右側: 締め切り + 質問数 + いいね */}
        <div className="flex items-center gap-3">
          {/* 締め切り */}
          {deadlineDisplay && (
            <span className={cn('text-xs flex items-center gap-0.5', deadlineDisplay.className)}>
              ⏰ {deadlineDisplay.text}
            </span>
          )}

          {/* 質問数 */}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircle className="h-4 w-4" />
            <span>{post.questions_count || 0}</span>
          </span>

          {/* いいね */}
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
    </Link>
  );
}
