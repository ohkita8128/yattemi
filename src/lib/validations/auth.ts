import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(1, 'パスワードを入力してください')
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        'パスワードは英字と数字を含めてください'
      ),
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
    username: z
      .string()
      .min(1, 'ユーザー名を入力してください')
      .min(3, 'ユーザー名は3文字以上で入力してください')
      .max(20, 'ユーザー名は20文字以内で入力してください')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'ユーザー名は英数字とアンダースコアのみ使用できます'
      ),
    displayName: z
      .string()
      .min(1, '表示名を入力してください')
      .max(30, '表示名は30文字以内で入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
