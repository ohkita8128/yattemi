'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = getClient();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

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
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error('表示名を入力してください');
      return;
    }

    if (!username.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
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
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('プロフィールを更新しました');
      router.push(ROUTES.PROFILE);
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505') {
        toast.error('このユーザー名は既に使用されています');
      } else {
        toast.error('更新に失敗しました');
      }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={ROUTES.PROFILE}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold">プロフィール編集</h1>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-24 w-24 object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-orange-500">
                {displayName[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">基本情報</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                ユーザー名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="yamada_taro"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="趣味や興味のあることを書いてみましょう"
            />
          </div>
        </div>

        {/* 学校情報 */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">学校情報</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">大学</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="〇〇大学"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">学部・学科</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="工学部 情報学科"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">学年</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">選択してください</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}年生</option>
              ))}
            </select>
          </div>
        </div>

        {/* SNSリンク */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">SNSリンク</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Twitter</label>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://twitter.com/username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Instagram</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://instagram.com/username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Webサイト</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  );
}
