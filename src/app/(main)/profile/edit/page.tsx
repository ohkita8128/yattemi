'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cropper, { Area } from 'react-easy-crop';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Trash2,
  User,
  Twitter,
  Instagram,
  Globe,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileImageGallery } from '@/components/profile/profile-image-gallery';

// 切り取った画像を生成する関数
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const size = Math.min(pixelCrop.width, 400);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

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
  const [grade, setGrade] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 画像切り取り用（react-easy-crop）
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // モーダル開時に背景スクロールを止める
  useEffect(() => {
    if (!showCropModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, [showCropModal]);

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
      setGrade(String(profile.grade || ''));
      setTwitterUrl(profile.twitter_url || '');
      setInstagramUrl(profile.instagram_url || '');
      setWebsiteUrl(profile.website_url || '');
      setIsPublic(profile.is_public !== false);
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // 画像選択 → 切り取りモーダルを開く
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // バリデーション
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('JPEG, PNG, WebP, GIF のみ対応しています');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    // リセット
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // クロップ完了時のコールバック
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 切り取り確定
  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !imgSrc) return;

    try {
      const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels);
      setCroppedAvatar(croppedBlob);
      setAvatarPreview(URL.createObjectURL(croppedBlob));
      setShowCropModal(false);
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('画像の切り取りに失敗しました');
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!croppedAvatar || !user) return avatarUrl;

    setIsUploadingAvatar(true);
    const supabase = supabaseRef.current;
    const oldAvatarUrl = avatarUrl;

    try {
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedAvatar, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 古いアバターを削除
      if (oldAvatarUrl) {
        const oldPath = oldAvatarUrl.split('/avatars/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]).catch(() => {
            console.warn('Failed to delete old avatar, but continuing...');
          });
        }
      }

      return newUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('画像のアップロードに失敗しました');
      return avatarUrl;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!avatarUrl || !user) return;

    const supabase = supabaseRef.current;

    try {
      const oldPath = avatarUrl.split('/avatars/')[1]?.split('?')[0];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      setAvatarUrl(null);
      setAvatarPreview(null);
      setCroppedAvatar(null);
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

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      toast.error('ユーザー名は小文字英数字とアンダースコアのみ使用できます');
      return;
    }

    setIsSubmitting(true);
    const supabase = supabaseRef.current;

    try {
      const newAvatarUrl = await uploadAvatar();

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

      if (refreshProfile) {
        await refreshProfile();
      }

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
          <p className="text-xs text-gray-500">JPEG, PNG, WebP, GIF（最大10MB）</p>
        </div>

        {/* ギャラリー（複数枚） */}
        {user && (
          <div className="p-6 bg-gray-50 rounded-xl">
            <ProfileImageGallery userId={user.id} maxImages={9} />
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
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="例: 学部3年、M1"
            />
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
            className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-orange-500' : 'bg-gray-300'
              }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'left-7' : 'left-1'
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

      {/* 画像切り取りモーダル（react-easy-crop） */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 bg-black text-white">
            <button
              onClick={() => setShowCropModal(false)}
              className="p-2"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="font-bold">画像を調整</h3>
            <button
              onClick={handleCropConfirm}
              className="text-orange-400 font-bold"
            >
              完了
            </button>
          </div>

          {/* Cropper */}
          <div className="relative flex-1">
            <Cropper
              image={imgSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* ズームスライダー */}
          <div className="p-4 bg-black">
            <div className="flex items-center gap-4 max-w-xs mx-auto">
              <ZoomOut className="h-5 w-5 text-white" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <ZoomIn className="h-5 w-5 text-white" />
            </div>
            <p className="text-center text-gray-400 text-xs mt-2">
              ピンチまたはスライダーで拡大縮小
            </p>
          </div>
        </div>
      )}
    </div>
  );
}