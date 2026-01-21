import { z } from 'zod';

export const applicationSchema = z.object({
  message: z
    .string()
    .max(500, 'メッセージは500文字以内で入力してください')
    .optional()
    .transform((val) => val || undefined),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
