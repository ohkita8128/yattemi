'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Trash2,
  User,
  Twitter,
  Instagram,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileImageGallery } from '@/components/profile/profile-image-gallery';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
  const supabaseRef = useRef(getClient());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // フォームの状態
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // プロフィールデータをセット
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setUniversity(profile.university || '');
      setDepartment(profile.department || '');
      setGrade(profile.grade || '');
      setTwitterUrl(profile.twitter_url || '');
      setInstagramUrl(profile.instagram_url || '');
      setWebsiteUrl(profile.website_url || '');
      setIsPublic(profile.is_public !== false);
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // バリデーション
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('JPEG, PNG, WebP, GIF のみ対応しています');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('ファイルサイズは5MB以下にしてください');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;

    setIsUploadingAvatar(true);
    const supabase = supabaseRef.current;
    const oldAvatarUrl = avatarUrl; // 古いURLを保存

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 先に新しいアバターをアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 公開URLを取得（キャッシュバスティング用のクエリパラメータ付き）
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // アップロード成功後に古いアバターを削除
      if (oldAvatarUrl) {
        const oldPath = oldAvatarUrl.split('/avatars/')[1]?.split('?')[0]; // クエリパラメータを除去
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]).catch(() => {
            // 削除失敗しても新しい画像は使える
            console.warn('Failed to delete old avatar, but continuing...');
          });
        }
      }

      return newUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('画像のアップロードに失敗しました');
      return avatarUrl; // 失敗時は元のURLを維持
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!avatarUrl || !user) return;

    const supabase = supabaseRef.current;

    try {
      const oldPath = avatarUrl.split('/avatars/')[1]?.split('?')[0]; // クエリパラメータを除去
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      setAvatarUrl(null);
      setAvatarPreview(null);
      setAvatarFile(null);
      toast.success('プロフィール画像を削除しました');

      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.error('Avatar remove error:', err);
      toast.error('削除に失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!displayName.trim()) {
      toast.error('表示名を入力してください');
      return;
    }

    if (!username.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    // ユーザー名のバリデーション
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      toast.error('ユーザー名は小文字英数字とアンダースコアのみ使用できます');
      return;
    }

    setIsSubmitting(true);
    const supabase = supabaseRef.current;

    try {
      // アバターをアップロード
      const newAvatarUrl = await uploadAvatar();

      // プロフィールを更新
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          bio: bio || null,
          university: university || null,
          department: department || null,
          grade: grade || null,
          twitter_url: twitterUrl || null,
          instagram_url: instagramUrl || null,
          website_url: websiteUrl || null,
          is_public: isPublic,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('このユーザー名は既に使用されています');
          return;
        }
        throw error;
      }

      toast.success('プロフィールを更新しました');
      
      // refreshProfile を待ってから遷移
      if (refreshProfile) {
        await refreshProfile();
      }
      
      // 少し待ってから遷移（状態更新を確実に）
      setTimeout(() => {
        router.push(`/users/${username}`);
      }, 100);
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const currentAvatar = avatarPreview || avatarUrl;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={profile ? `/users/${profile.username}` : '/'}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold">プロフィール編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アバター */}
        <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold overflow-hidden">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="プロフィール画像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-orange-600 hover:underline"
            >
              画像を変更
            </button>
            {currentAvatar && (
              <button
                type="button"
                onClick={removeAvatar}
                className="text-sm text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                削除
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">JPEG, PNG, WebP, GIF（最大5MB）</p>
        </div>
        
        {/* プロフィール写真（複数枚） */}
        {user && (
          <div className="p-6 bg-gray-50 rounded-xl">
            <ProfileImageGallery userId={user.id} maxImages={5} />
          </div>
        )}

        {/* 表示名 */}
        <div className="space-y-2">
          <label className="block font-medium">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="山田太郎"
          />
        </div>

        {/* ユーザー名 */}
        <div className="space-y-2">
          <label className="block font-medium">
            ユーザー名 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="flex-1 h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="yamada_taro"
            />
          </div>
          <p className="text-xs text-gray-500">小文字英数字とアンダースコアのみ</p>
        </div>

        {/* 自己紹介 */}
        <div className="space-y-2">
          <label className="block font-medium">自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="自己紹介を書いてください"
          />
          <p className="text-xs text-gray-500">{bio.length}/500文字</p>
        </div>

        {/* 大学情報 */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium">大学情報</h3>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600">大学名</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="〇〇大学"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600">学部・学科</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="工学部 情報工学科"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600">学年</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">選択してください</option>
              <option value={1}>1年生</option>
              <option value={2}>2年生</option>
              <option value={3}>3年生</option>
              <option value={4}>4年生</option>
              <option value={5}>修士1年</option>
              <option value={6}>修士2年</option>
              <option value={7}>博士</option>
            </select>
          </div>
        </div>

        {/* SNSリンク */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium">SNSリンク</h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Twitter className="h-4 w-4" />
              Twitter / X
            </label>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://twitter.com/username"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Instagram className="h-4 w-4" />
              Instagram
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://instagram.com/username"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="h-4 w-4" />
              Webサイト
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* 公開設定 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium">プロフィールを公開</p>
            <p className="text-sm text-gray-500">オフにすると自分だけが見れます</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isPublic ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                isPublic ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting || isUploadingAvatar}
          className="w-full h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {(isSubmitting || isUploadingAvatar) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isSubmitting ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  );
}
