export const APP_CONFIG = {
  name: 'YatteMi!',
  description: '趣味・技術をサポートしたい人とチャレンジしたい人をつなぐプラットフォーム',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const;

export const POST_TYPES = {
  support: {
    label: 'サポートしたい',
    emoji: '🎓',
    color: 'support',
    description: 'あなたのスキルや知識を共有しましょう',
  },
  challenge: {
    label: 'チャレンジしたい',
    emoji: '📘',
    color: 'challenge',
    description: '新しいことをチャレンジしたい人を見つけましょう',
  },
} as const;

export const POST_STATUS = {
  open: { label: '募集中', color: 'green' },
  closed: { label: '募集終了', color: 'gray' },
  completed: { label: '完了', color: 'blue' },
  cancelled: { label: 'キャンセル', color: 'red' },
} as const;

export const APPLICATION_STATUS = {
  pending: { label: '審査中', color: 'yellow' },
  accepted: { label: '承認', color: 'green' },
  rejected: { label: '非承認', color: 'red' },
  cancelled: { label: 'キャンセル', color: 'gray' },
} as const;

export const MATCH_STATUS = {
  active: { label: '進行中', color: 'blue' },
  completed: { label: '完了', color: 'green' },
  cancelled: { label: 'キャンセル', color: 'red' },
} as const;

export const GRADES = [
  { value: 1, label: '1年' },
  { value: 2, label: '2年' },
  { value: 3, label: '3年' },
  { value: 4, label: '4年' },
  { value: 5, label: '修士1年' },
  { value: 6, label: '修士2年' },
] as const;
