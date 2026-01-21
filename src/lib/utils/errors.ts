import type { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Supabaseエラーをユーザーフレンドリーなメッセージに変換
 */
export function getSupabaseErrorMessage(error: PostgrestError | null): string {
  if (!error) return '不明なエラーが発生しました';

  // Supabaseのエラーコードに基づいてメッセージを返す
  const errorMessages: Record<string, string> = {
    '23505': 'すでに登録されています',
    '23503': '関連するデータが存在しません',
    '42501': 'この操作を行う権限がありません',
    '22001': '入力が長すぎます',
    PGRST116: 'データが見つかりませんでした',
  };

  return errorMessages[error.code] || error.message || '不明なエラーが発生しました';
}

/**
 * 認証エラーをユーザーフレンドリーなメッセージに変換
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    invalid_credentials: 'メールアドレスまたはパスワードが間違っています',
    email_not_confirmed: 'メールアドレスの確認が完了していません',
    user_already_exists: 'このメールアドレスは既に登録されています',
    weak_password: 'パスワードが弱すぎます。8文字以上で設定してください',
    invalid_email: '有効なメールアドレスを入力してください',
    user_not_found: 'ユーザーが見つかりません',
    email_address_invalid: '無効なメールアドレスです',
    signup_disabled: '現在、新規登録を受け付けていません',
    over_request_rate_limit: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  };

  return errorMessages[errorCode] || '認証エラーが発生しました';
}

/**
 * エラーオブジェクトからメッセージを抽出
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '予期しないエラーが発生しました';
}

/**
 * API レスポンス用のエラーフォーマット
 */
export function formatApiError(error: unknown) {
  const message = getErrorMessage(error);
  const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
  const details = error instanceof AppError ? error.details : undefined;

  return {
    success: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}
