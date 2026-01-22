'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 1, title: '基本情報', description: '表示名とユーザー名を設定' },
  { id: 2, title: '学校情報', description: '大学・学部・学年を入力' },
  { id: 3, title: 'プロフィール', description: '自己紹介とアイコンを設定' },
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

const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer_not_to_say', label: '回答しない' },
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
    display_name: '',
    username: '',
    university: '',
    faculty: '',
    grade: '',
    bio: '',
    birth_date: '',
    gender: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        .select('onboarding_completed, display_name, username')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      // 既存の情報があれば埋める
      if (profile) {
        setFormData(prev => ({
          ...prev,
          display_name: profile.display_name || '',
          username: profile.username || '',
        }));
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.display_name.trim()) {
        newErrors.display_name = '表示名を入力してください';
      }
      if (!formData.username.trim()) {
        newErrors.username = 'ユーザー名を入力してください';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = '英数字とアンダースコアのみ使用できます';
      } else if (formData.username.length < 3) {
        newErrors.username = '3文字以上で入力してください';
      }
    }

    if (step === 2) {
      if (!formData.university.trim()) {
        newErrors.university = '大学名を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async (): Promise<boolean> => {
    const supabase = supabaseRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: existing } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', formData.username)
      .neq('id', user?.id)
      .single();

    if (existing) {
      setErrors(prev => ({ ...prev, username: 'このユーザー名は既に使用されています' }));
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      const isAvailable = await checkUsernameAvailability();
      if (!isAvailable) return;
    }

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
    if (!validateStep(currentStep)) return;

    setLoading(true);
    const supabase = supabaseRef.current;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      let avatar_url = null;

      // アバターをアップロード
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatar_url = publicUrl;
        }
      }

      // プロフィール更新
      const updateData: Record<string, any> = {
        display_name: formData.display_name,
        username: formData.username,
        university: formData.university || null,
        faculty: formData.faculty || null,
        grade: formData.grade || null,
        bio: formData.bio || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
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
          <p className="text-gray-600 mt-2">プロフィールを設定しましょう</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.id < currentStep
                    ? 'bg-orange-500 text-white'
                    : step.id === currentStep
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
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
          {/* Step 1: 基本情報 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">表示名 *</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="山田 太郎"
                  className={errors.display_name ? 'border-red-500' : ''}
                />
                {errors.display_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="username">ユーザー名 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="yamada_taro"
                    className={`pl-8 ${errors.username ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">英数字とアンダースコアのみ</p>
              </div>

              <div>
                <Label htmlFor="gender">性別（任意）</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">選択してください</option>
                  {GENDERS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="birth_date">生年月日（任意）</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Step 2: 学校情報 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="university">大学名 *</Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="〇〇大学"
                  className={errors.university ? 'border-red-500' : ''}
                />
                {errors.university && (
                  <p className="text-red-500 text-sm mt-1">{errors.university}</p>
                )}
              </div>

              <div>
                <Label htmlFor="faculty">学部・学科（任意）</Label>
                <Input
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="工学部 情報工学科"
                />
              </div>

              <div>
                <Label htmlFor="grade">学年（任意）</Label>
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
            </div>
          )}

          {/* Step 3: プロフィール */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <Label className="mb-2">プロフィール写真（任意）</Label>
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
                <Label htmlFor="bio">自己紹介（任意）</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="趣味や得意なこと、学びたいことなどを書いてみましょう！"
                  rows={4}
                />
              </div>
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
                    完了
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
            あとで設定する
          </button>
        </p>
      </div>
    </div>
  );
}
