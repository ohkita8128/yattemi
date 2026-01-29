'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Camera, ChevronRight, ChevronLeft, Check, Loader2, X,
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

  // 画像切り取り用
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

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
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow || '';
      document.body.style.touchAction = prevTouchAction || '';
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

    // crop状態をリセット
    setCrop(undefined);
    setCompletedCrop(undefined);

    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // inputをリセット（同じファイルを再選択可能に）
    e.target.value = '';
  };

  // 画像ロード時にクロップ領域を設定
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height } = img;

    const cropSize = Math.min(width, height) * 0.9;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;

    const newCrop: Crop = {
      unit: 'px',
      x,
      y,
      width: cropSize,
      height: cropSize,
    };

    setCrop(newCrop);
    setCompletedCrop({
      unit: 'px',
      x,
      y,
      width: cropSize,
      height: cropSize,
    });
  }, []);

  // クロップ確定
  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    const imgEl = imgRef.current;
    const scaleX = imgEl.naturalWidth / imgEl.width;
    const scaleY = imgEl.naturalHeight / imgEl.height;
    const pixelCrop = completedCrop;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pixelCrop.width * scaleX);
    canvas.height = Math.round(pixelCrop.height * scaleY);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgEl,
      Math.round(pixelCrop.x * scaleX),
      Math.round(pixelCrop.y * scaleY),
      Math.round(pixelCrop.width * scaleX),
      Math.round(pixelCrop.height * scaleY),
      0,
      0,
      canvas.width,
      canvas.height
    );

    // 正方形にリサイズ（最大400px）
    const size = Math.min(canvas.width, 400);
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = size;
    resizedCanvas.height = size;
    const rctx = resizedCanvas.getContext('2d');
    if (!rctx) return;
    rctx.drawImage(canvas, 0, 0, size, size);

    // toBlob が使えるならそちらを優先（非同期）
    resizedCanvas.toBlob(
      (blob) => {
        if (blob) {
          setCroppedAvatar(blob);
          setAvatarPreview(URL.createObjectURL(blob));
        } else {
          // fallback: toDataURL -> convert to blob
          try {
            const dataUrl = resizedCanvas.toDataURL('image/jpeg', 0.9);
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) {
              console.error('Invalid dataUrl');
              setShowCropModal(false);
              return;
            }
            const byteString = atob(base64Data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: 'image/jpeg' });
            setCroppedAvatar(fallbackBlob);
            setAvatarPreview(URL.createObjectURL(fallbackBlob));
          } catch (err) {
            console.error('toBlob / fallback failed', err);
          }
        }
        setShowCropModal(false);
      },
      'image/jpeg',
      0.9
    );
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

    try {
      const supabase = supabaseRef.current;

      // 画像アップロード
      let avatarUrl = null;
      if (croppedAvatar && userId) {
        const fileName = `${userId}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await (supabase as any).storage
          .from('avatars')
          .upload(fileName, croppedAvatar, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = (supabase as any).storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // プロフィール更新
      const updateData: any = {
        display_name: displayName.trim(),
        onboarding_completed: true,
        preference: preference,
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      if (formData.university) {
        updateData.university = formData.university;
      }
      if (formData.faculty) {
        updateData.faculty = formData.faculty;
      }
      if (formData.grade) {
        updateData.grade = formData.grade;
      }

      await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      // user_interests に保存
      if (selectedCategories.length > 0) {
        const interestRows = selectedCategories.map(categoryId => ({
          user_id: userId,
          category_id: categoryId,
        }));

        await (supabase as any)
          .from('user_interests')
          .upsert(interestRows, { onConflict: 'user_id,category_id' });
      }

      router.push('/explore');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-500">YatteMi!</h1>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 h-1 mx-0.5 rounded-full transition-colors ${step.id <= currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            {STEPS[currentStep - 1]?.title} - {STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {/* Step 1: プロフィール */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* アバター */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-gray-400" />
                  )}
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">タップして画像を選択</p>
              </div>

              {/* 名前 */}
              <div>
                <Label htmlFor="displayName" className="text-base font-medium">
                  ニックネーム <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="みんなに表示される名前"
                  className="mt-2 text-lg h-12"
                  maxLength={20}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {displayName.length}/20
                </p>
              </div>
            </div>
          )}

          {/* Step 2: カテゴリ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                興味のあるカテゴリを選んでね（{selectedCategories.length}/3以上）
              </p>

              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] || Sparkles;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
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
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${preference === 'support'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${preference === 'support' ? 'bg-green-500 text-white' : 'bg-green-100'
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
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${preference === 'challenge'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${preference === 'challenge' ? 'bg-orange-500 text-white' : 'bg-orange-100'
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
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${preference === 'both'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${preference === 'both' ? 'bg-purple-500 text-white' : 'bg-purple-100'
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

      {/* 画像切り取りモーダル */}
      {showCropModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onTouchMove={(e) => e.preventDefault()}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">画像を調整</h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 切り取りエリア - スタイルを追加 */}
            <div
              className="relative bg-gray-100 rounded-lg overflow-hidden mb-4"
              onTouchMove={(e) => e.stopPropagation()}
            >
              <style jsx global>{`
                .ReactCrop {
                  touch-action: none !important;
                }
                .ReactCrop__image {
                  touch-action: none !important;
                  user-select: none !important;
                  -webkit-user-drag: none !important;
                }
                .ReactCrop__crop-selection {
                  touch-action: none !important;
                }
              `}</style>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[50vh] mx-auto block select-none"
                  style={{
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserDrag: 'none'
                  } as React.CSSProperties}
                  draggable={false}
                />
              </ReactCrop>
            </div>

            {/* ヒント */}
            <p className="text-xs text-gray-500 text-center mb-3">
              円をドラッグして位置を調整、角をドラッグしてサイズを変更
            </p>

            {/* ボタン */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCropModal(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCropComplete}
                className="flex-1"
                disabled={!completedCrop}
              >
                決定
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}