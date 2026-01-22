'use client';

import { 
  SENPAI_BADGES, 
  KOUHAI_BADGES, 
  COMMON_BADGES,
  UserStats 
} from '@/hooks/use-reviews';

interface TeachStatsProps {
  stats: UserStats | null;
}

// ティーチ（先輩として）の統計表示
export function TeachStats({ stats }: TeachStatsProps) {
  if (!stats) return null;

  const badges = [
    { key: 'clear', count: stats.senpai_badge_clear, ...SENPAI_BADGES.clear },
    { key: 'helpful', count: stats.senpai_badge_helpful, ...SENPAI_BADGES.helpful },
    { key: 'godsenpai', count: stats.senpai_badge_godsenpai, ...SENPAI_BADGES.godsenpai },
    { key: 'awesome', count: stats.badge_awesome, ...COMMON_BADGES.awesome },
    { key: 'thanks', count: stats.badge_thanks, ...COMMON_BADGES.thanks },
    { key: 'again', count: stats.badge_again, ...COMMON_BADGES.again },
  ].filter(b => b.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <span className="font-semibold">ティーチ</span>
        <span className="text-orange-500 font-bold">{stats.teach_count}回</span>
        <span className="text-gray-500">完了</span>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {badges.map(({ key, count, emoji }) => (
            <div key={key} className="flex items-center gap-1" title={key}>
              <span className="text-xl">{emoji}</span>
              <span className="text-sm text-gray-600 font-medium">x{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">まだバッジがありません</p>
      )}
    </div>
  );
}

interface ChallengeStatsProps {
  stats: UserStats | null;
}

// チャレンジ（後輩として）の統計表示
export function ChallengeStats({ stats }: ChallengeStatsProps) {
  if (!stats) return null;

  const badges = [
    { key: 'eager', count: stats.kouhai_badge_eager, ...KOUHAI_BADGES.eager },
    { key: 'quicklearner', count: stats.kouhai_badge_quicklearner, ...KOUHAI_BADGES.quicklearner },
    { key: 'hardworker', count: stats.kouhai_badge_hardworker, ...KOUHAI_BADGES.hardworker },
    { key: 'awesome', count: stats.badge_awesome, ...COMMON_BADGES.awesome },
    { key: 'thanks', count: stats.badge_thanks, ...COMMON_BADGES.thanks },
    { key: 'again', count: stats.badge_again, ...COMMON_BADGES.again },
  ].filter(b => b.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📚</span>
        <span className="font-semibold">チャレンジ</span>
        <span className="text-orange-500 font-bold">{stats.challenge_count}回</span>
        <span className="text-gray-500">完了</span>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {badges.map(({ key, count, emoji }) => (
            <div key={key} className="flex items-center gap-1" title={key}>
              <span className="text-xl">{emoji}</span>
              <span className="text-sm text-gray-600 font-medium">x{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">まだバッジがありません</p>
      )}
    </div>
  );
}

interface ReviewCommentProps {
  comment: string;
  reviewerName: string;
  reviewerRole: 'senpai' | 'kouhai';
  postTitle?: string;
}

// レビューコメント表示
export function ReviewComment({ 
  comment, 
  reviewerName, 
  reviewerRole,
  postTitle 
}: ReviewCommentProps) {
  const roleLabel = reviewerRole === 'senpai' ? '先輩' : '後輩';

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-2">💬 {roleLabel}からのコメント</p>
      <p className="text-sm text-gray-700">「{comment}」</p>
      <p className="text-xs text-gray-400 mt-2">
        - {reviewerName}さん
        {postTitle && <span>（{postTitle}）</span>}
      </p>
    </div>
  );
}
