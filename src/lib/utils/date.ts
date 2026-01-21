import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisYear,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 相対的な時間表示（〜前）
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: ja });
}

/**
 * スマートな日付表示
 * - 今日: 「今日 14:30」
 * - 昨日: 「昨日 14:30」
 * - 今年: 「1月15日」
 * - それ以外: 「2024年1月15日」
 */
export function formatSmartDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return `今日 ${format(date, 'HH:mm')}`;
  }

  if (isYesterday(date)) {
    return `昨日 ${format(date, 'HH:mm')}`;
  }

  if (isThisYear(date)) {
    return format(date, 'M月d日', { locale: ja });
  }

  return format(date, 'yyyy年M月d日', { locale: ja });
}

/**
 * フルの日時表示
 */
export function formatFullDateTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy年M月d日 HH:mm', { locale: ja });
}

/**
 * 日付のみ
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy年M月d日', { locale: ja });
}

/**
 * 時刻のみ
 */
export function formatTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'HH:mm', { locale: ja });
}
