'use client';

import { useState, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export function useAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, refreshProfile } = useAuth();
  const supabaseRef = useRef(getClient());

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      setError('ログインしてください');
      return null;
    }

    // バリデーション
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('JPEG, PNG, WebP, GIF のみ対応しています');
      return null;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('ファイルサイズは5MB以下にしてください');
      return null;
    }

    setIsUploading(true);
    setError(null);

    const supabase = supabaseRef.current;

    try {
      // ファイル名を生成（ユーザーID + タイムスタンプ）
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 古いアバターを削除（あれば）
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // アップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // プロフィールを更新
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // プロフィールを再取得
      if (refreshProfile) {
        await refreshProfile();
      }

      return avatarUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('アップロードに失敗しました');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async (): Promise<boolean> => {
    if (!user || !profile?.avatar_url) return false;

    setIsUploading(true);
    setError(null);

    const supabase = supabaseRef.current;

    try {
      // ストレージから削除
      const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);

      // プロフィールを更新
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (refreshProfile) {
        await refreshProfile();
      }

      return true;
    } catch (err) {
      console.error('Avatar remove error:', err);
      setError('削除に失敗しました');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    isUploading,
    error,
  };
}
