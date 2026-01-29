'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cropper, { Area } from 'react-easy-crop';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Camera, ChevronRight, ChevronLeft, Check, Loader2, X,
  ZoomIn, ZoomOut,
  Code, Palette, Music, Trophy, Globe, UtensilsCrossed,
  Camera as CameraIcon, Briefcase, Brush, Gamepad2, Sparkles,
  BookOpen, Shirt, GraduationCap, Landmark, Heart
} from 'lucide-react';

// カテゴリアイコンマッピング
const CATEGORY_ICONS: Record<string, any> = {
  programming: Code,
  design: Palette,
  music: Music,
  sports: Trophy,
  language: Globe,
  cooking: UtensilsCrossed,
  media: CameraIcon,
  business: Briefcase,
  art: Brush,
  gaming: Gamepad2,
  other: Sparkles,
  study: BookOpen,
  beauty: Sparkles,
  fashion: Shirt,
  career: GraduationCap,
  traditional: Landmark,
  lifestyle: Heart,
};

const STEPS = [
  { id: 1, title: 'プロフィール', description: 'アイコンと名前を設定' },
  { id: 2, title: '興味のあるジャンル', description: '3つ以上選んでね' },
  { id: 3, title: 'やりたいこと', description: 'どっちに興味ある？' },
  { id: 4, title: '学校情報', description: '任意だよ' },
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

// 切り取った画像を生成する関数
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // 出力サイズ（最大400px）
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

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseRef = useRef(getClient());
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Step 1: プロフィール
  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像切り取り用（react-easy-crop）
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Step 2: カテゴリ
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Step 3: 傾向
  const [preference, setPreference] = useState<'support' | 'challenge' | 'both'>('both');

  // Step 4: 学校情報
  const [formData, setFormData] = useState({
    university: '',
    faculty: '',
    grade: '',
  });

  // モーダル開時に背景スクロールを止める
  useEffect(() => {
    if (!showCropModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, [showCropModal]);

  // 認証チェック & カテゴリ取得
  useEffect(() => {
    const init = async () => {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // プロフィール確認
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('onboarding_completed, display_name')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      // 既存の名前があれば設定
      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      // カテゴリ取得
      const { data: cats } = await (supabase as any)
        .from('categories')
        .select('*')
        .neq('slug', 'other')
        .order('sort_order', { ascending: true });

      if (cats) setCategories(cats);

      setCheckingAuth(false);
    };

    init();
  }, [router]);

  // 画像選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    
    // inputをリセット（同じファイルを再選択可能に）
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
      alert('画像の切り取りに失敗しました');
    }
  };

  // カテゴリ選択
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ステップ移動
  const nextStep = () => {
    if (currentStep === 1 && !displayName.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (currentStep === 2 && selectedCategories.length < 3) {
      alert('3つ以上選んでね！');
      return;
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

  // 送信
  const handleSubmit = async () => {
    setLoading(true);
    const supabase = supabaseRef.current;

    try {
      if (!userId) throw new Error('ログインが必要です');

      let avatar_url = null;

      // アバターをアップロード
      if (croppedAvatar) {
        const fileName = `${userId}-${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, croppedAvatar);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatar_url = publicUrl;
        }
      }

      // プロフィール更新
      const updateData: Record<string, any> = {
        display_name: displayName,
        university: formData.university || null,
        faculty: formData.faculty || null,
        grade: formData.grade || null,
        preference: preference,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (avatar_url) {
        updateData.avatar_url = avatar_url;
      }

      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) throw profileError;

      // 興味カテゴリを保存
      if (selectedCategories.length > 0) {
        // 既存を削除
        await (supabase as any)
          .from('user_interests')
          .delete()
          .eq('user_id', userId);

        // 新規追加
        const interestData = selectedCategories.map(categoryId => ({
          user_id: userId,
          category_id: categoryId,
        }));

        const { error: interestError } = await (supabase as any)
          .from('user_interests')
          .insert(interestData);

        if (interestError) throw interestError;
      }

      router.push('/explore');
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
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ようこそ！🎉</h1>
          <p className="text-gray-600 mt-1">あと少しで準備完了</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  step.id < currentStep
                    ? 'bg-orange-500 text-white'
                    : step.id === currentStep
                    ? 'bg-orange-500 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2 font-medium">
            {STEPS[currentStep - 1]?.title}
          </p>
          <p className="text-center text-xs text-gray-500">
            {STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">

          {/* Step 1: プロフィール */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* アバター */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center cursor-pointer hover:scale-105 transition overflow-hidden border-4 border-white shadow-lg"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-10 w-10 text-orange-400" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-gray-500 text-sm mt-3">タップして写真を選択</p>
              </div>

              {/* 名前 */}
              <div>
                <Label htmlFor="displayName" className="text-base">ニックネーム</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: たろう"
                  className="mt-1 text-lg h-12"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">後から変更できます</p>
              </div>
            </div>
          )}

          {/* Step 2: カテゴリ選択 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                選択中: <span className="font-bold text-orange-500">{selectedCategories.length}</span> / 3+
              </p>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] || Sparkles;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 scale-105'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100'
                        }`}
                        style={isSelected ? {} : { backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: 傾向 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                YatteMi!でやりたいことは？
              </p>

              <button
                onClick={() => setPreference('support')}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                  preference === 'support'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                    preference === 'support' ? 'bg-green-500 text-white' : 'bg-green-100'
                  }`}>
                    🎓
                  </div>
                  <div>
                    <p className="font-bold text-lg">教えたい！</p>
                    <p className="text-sm text-gray-500">得意なことを活かしたい</p>
                  </div>
                  {preference === 'support' && <Check className="h-6 w-6 text-green-500 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setPreference('challenge')}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                  preference === 'challenge'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                    preference === 'challenge' ? 'bg-orange-500 text-white' : 'bg-orange-100'
                  }`}>
                    📚
                  </div>
                  <div>
                    <p className="font-bold text-lg">学びたい！</p>
                    <p className="text-sm text-gray-500">新しいことに挑戦したい</p>
                  </div>
                  {preference === 'challenge' && <Check className="h-6 w-6 text-orange-500 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setPreference('both')}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                  preference === 'both'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                    preference === 'both' ? 'bg-purple-500 text-white' : 'bg-purple-100'
                  }`}>
                    🔄
                  </div>
                  <div>
                    <p className="font-bold text-lg">両方！</p>
                    <p className="text-sm text-gray-500">教えたり学んだりしたい</p>
                  </div>
                  {preference === 'both' && <Check className="h-6 w-6 text-purple-500 ml-auto" />}
                </div>
              </button>
            </div>
          )}

          {/* Step 4: 学校情報 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                同じ大学の人とマッチングしやすくなるよ
              </p>

              <div>
                <Label htmlFor="university">大学名</Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="〇〇大学"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="faculty">学部・学科</Label>
                <Input
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
                  placeholder="工学部 情報工学科"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="grade">学年</Label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                >
                  <option value="">選択してください</option>
                  {GRADES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                ※ すべて任意です。後から設定できます。
              </p>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep} className="px-6">
                <ChevronLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} className="px-6">
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="px-8">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    はじめる！
                    <Check className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* スキップリンク */}
        {currentStep === 4 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            <button
              onClick={handleSubmit}
              className="underline hover:text-gray-700"
              disabled={loading}
            >
              スキップして始める
            </button>
          </p>
        )}
      </div>

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