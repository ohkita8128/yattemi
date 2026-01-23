'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { compressAvatar } from '@/lib/image-compression';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 1, title: '学校情報', description: '大学・学部・学年を入力（任意）' },
  { id: 2, title: 'プロフィール', description: '自己紹介とアイコンを設定（任意）' },
];

const GRADES = [
  { value: 'B1', label: '学部1年' },
  { value: 'B2', label: '学部2年' },
  { value: 'B3', label: '学部3年' },
  { value: 'B4', label: '学部4年' },
  { value: 'M1', label: '修士1年' },
  { value: 'M2', label: '修士2年' },
  { value: 'D', label: '博士課程' },
  { value: 'other', label: 'その他' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseRef = useRef(getClient());
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    university: '',
    faculty: '',
    grade: '',
    bio: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 既にオンボーディング完了済みならダッシュボードへ
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = supabaseRef.current;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      let avatar_url = null;

      // アバターをアップロード
      if (avatarFile) {
        const compressedFile = await compressAvatar(avatarFile);
        const fileName = `${user.id}-${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, compressedFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatar_url = publicUrl;
        }
      }

      // プロフィール更新
      const updateData: Record<string, any> = {
        university: formData.university || null,
        faculty: formData.faculty || null,
        grade: formData.grade || null,
        bio: formData.bio || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (avatar_url) {
        updateData.avatar_url = avatar_url;
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">YatteMi! へようこそ！</h1>
          <p className="text-gray-600 mt-2">あと少しで準備完了です</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  step.id < currentStep
                    ? 'bg-orange-500 text-white'
                    : step.id === currentStep
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {/* Step 1: 学校情報 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="university">大学名</Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="〇〇大学"
                />
              </div>

              <div>
                <Label htmlFor="faculty">学部・学科</Label>
                <Input
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="工学部 情報工学科"
                />
              </div>

              <div>
                <Label htmlFor="grade">学年</Label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">選択してください</option>
                  {GRADES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                ※ すべて任意です。後から設定できます。
              </p>
            </div>
          )}

          {/* Step 2: プロフィール */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <Label className="mb-2">アイコン</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition overflow-hidden border-2 border-dashed border-gray-300"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-gray-500 text-xs mt-2">タップして写真を選択</p>
              </div>

              <div>
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="趣味や得意なこと、学びたいことなどを書いてみましょう！"
                  rows={4}
                />
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                ※ すべて任意です。後から設定できます。
              </p>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    はじめる
                    <Check className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* スキップリンク */}
        <p className="text-center text-sm text-gray-500 mt-4">
          <button
            onClick={handleSubmit}
            className="underline hover:text-gray-700"
            disabled={loading}
          >
            スキップして始める
          </button>
        </p>
      </div>
    </div>
  );
}
