import { z } from 'zod';

export const postSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .min(3, 'タイトルは3文字以上で入力してください')
    .max(100, 'タイトルは100文字以内で入力してください'),
  description: z
    .string()
    .min(1, '内容を入力してください')
    .min(1, '内容を入力してください')
    .max(2000, '内容は2000文字以内で入力してください'),
  type: z.enum(['teach', 'learn'], {
    required_error: 'タイプを選択してください',
  }),
  categoryId: z
    .number({
      required_error: 'カテゴリを選択してください',
    })
    .int()
    .positive('カテゴリを選択してください'),
  maxApplicants: z
    .number()
    .int()
    .min(1, '募集人数は1人以上です')
    .max(10, '募集人数は10人以内です')
    .default(1),
  location: z.string().max(100, '場所は100文字以内で入力してください').optional(),
  isOnline: z.boolean().default(true),
  // 旧フィールド（後方互換のため残す）
  preferredSchedule: z
    .string()
    .max(200, '希望日程は200文字以内で入力してください')
    .optional(),
  // 新しいスケジュールフィールド
  availableDays: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .default([]),
  availableTimes: z
    .array(z.enum(['morning', 'afternoon', 'evening']))
    .default([]),
  specificDates: z
    .array(z.object({
      date: z.string(),
      start: z.string(),
      end: z.string(),
    }))
    .default([]),
  tags: z
    .array(z.string().max(20, 'タグは20文字以内で入力してください'))
    .max(5, 'タグは5つまでです')
    .default([]),
  // レベル関連
  myLevel: z
    .number()
    .int()
    .min(0, 'レベルは0以上です')
    .max(10, 'レベルは10以下です')
    .default(5),
  targetLevelMin: z
    .number()
    .int()
    .min(0, 'レベルは0以上です')
    .max(10, 'レベルは10以下です')
    .default(0),
  targetLevelMax: z
    .number()
    .int()
    .min(0, 'レベルは0以上です')
    .max(10, 'レベルは10以下です')
    .default(10),
});

export const postUpdateSchema = postSchema.partial();

export type PostFormData = z.infer<typeof postSchema>;
export type PostUpdateData = z.infer<typeof postUpdateSchema>;
