import { z } from 'zod';

const urlSchema = z
  .string()
  .url('有効なURLを入力してください')
  .or(z.literal(''))
  .optional()
  .transform((val) => val || undefined);

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(30, '表示名は30文字以内で入力してください'),
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional()
    .transform((val) => val || undefined),
  university: z
    .string()
    .max(50, '大学名は50文字以内で入力してください')
    .optional()
    .transform((val) => val || undefined),
  department: z
    .string()
    .max(50, '学部・学科は50文字以内で入力してください')
    .optional()
    .transform((val) => val || undefined),
  grade: z
    .number()
    .int()
    .min(1, '学年は1以上です')
    .max(6, '学年は6以下です')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  twitterUrl: urlSchema,
  instagramUrl: urlSchema,
  websiteUrl: urlSchema,
});

export type ProfileFormData = z.infer<typeof profileSchema>;
