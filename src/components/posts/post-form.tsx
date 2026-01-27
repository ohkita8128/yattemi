'use client';

import { useState } from 'react';
import { X, ImagePlus, Loader2, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressPostImage } from '@/lib/image-compression';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LevelSlider, LevelRangeSlider } from '@/components/ui/level-slider';
import { ScheduleSelector } from '@/components/ui/schedule-selector';
import { postSchema, type PostFormData } from '@/lib/validations/post';
import { POST_TYPES } from '@/lib/constants';
import type { Category, PostType } from '@/types';

interface PostFormProps {
  categories: Category[];
  defaultType?: PostType;
  defaultValues?: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => Promise<void>;
  isSubmitting?: boolean;
}

// 締め切りプリセット
const DEADLINE_PRESETS = [
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
] as const;

function getDefaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14); // デフォルト2週間
  return date.toISOString();
}

function formatDeadlineDisplay(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return `${month}/${day}（あと${diffDays}日）`;
}

function formatDateForInput(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0]!;
}

export function PostForm({
  categories,
  defaultType = 'support',
  defaultValues,
  onSubmit,
  isSubmitting,
}: PostFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: defaultType,
      maxApplicants: 1,
      isOnline: null,
      tags: [],
      myLevel: 5,
      targetLevelMin: 0,
      targetLevelMax: 10,
      availableDays: [],
      availableTimes: [],
      specificDates: [],
      deadlineAt: getDefaultDeadline(),
      ...defaultValues,
    },
  });

  const [images, setImages] = useState<string[]>(defaultValues?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 4) {
      alert('画像は4枚までです');
      return;
    }

    setUploadingImages(true);
    const supabase = createClient();
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert('ファイルサイズは5MB以下にしてください');
          continue;
        }
        if (!file.type.startsWith('image/')) {
          alert('画像ファイルのみアップロードできます');
          continue;
        }

        const compressedFile = await compressPostImage(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      setValue('images', updatedImages);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    setValue('images', updatedImages);
  };

  const setDeadlineByDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setValue('deadlineAt', date.toISOString());
    setShowDatePicker(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    date.setHours(23, 59, 59, 999); // 日付の終わりに設定
    setValue('deadlineAt', date.toISOString());
  };

  const selectedType = watch('type');
  const isOnline = watch('isOnline');
  const myLevel = watch('myLevel') ?? 5;
  const targetLevelMin = watch('targetLevelMin') ?? 0;
  const targetLevelMax = watch('targetLevelMax') ?? 10;
  const availableDays = watch('availableDays') ?? [];
  const availableTimes = watch('availableTimes') ?? [];
  const specificDates = watch('specificDates') ?? [];
  const maxApplicants = watch('maxApplicants') ?? 1;
  const watchedDeadline = watch('deadlineAt');
const deadlineAt: string = watchedDeadline !== undefined ? watchedDeadline : getDefaultDeadline();

  // 締め切り日の最小・最大
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label required>投稿タイプ</Label>
        <div className="grid grid-cols-2 gap-4">
          {(['support', 'challenge'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type
                  ? type === 'support'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl mb-2 block">{POST_TYPES[type].emoji}</span>
              <span className="font-semibold block">{POST_TYPES[type].label}</span>
              <span className="text-sm text-muted-foreground">
                {POST_TYPES[type].description}
              </span>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" required>
          タイトル
        </Label>
        <Input
          id="title"
          placeholder="例: Pythonの基礎を教えます！"
          error={!!errors.title}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" required>
          詳細
        </Label>
        <Textarea
          id="description"
          placeholder="どんなことをサポートしたい/チャレンジしたいですか？具体的に書くとマッチングしやすくなります。"
          className="min-h-[150px]"
          error={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>画像（最大4枚）</Label>
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-orange-50">
              {uploadingImages ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-2">追加</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label required>カテゴリ</Label>
        <Select
          onValueChange={(v) => setValue('categoryId', parseInt(v))}
        >
          <SelectTrigger error={!!errors.categoryId}>
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <Label>募集期限</Label>
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          {/* プリセットボタン */}
          <div className="flex gap-2">
            {DEADLINE_PRESETS.map((preset) => {
              const presetDate = new Date();
              presetDate.setDate(presetDate.getDate() + preset.days);
              const isSelected = Math.abs(new Date(deadlineAt).getTime() - presetDate.getTime()) < 1000 * 60 * 60 * 24;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDeadlineByDays(preset.days)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          
          {/* 現在の設定表示 + カレンダー切り替え */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              締め切り: <span className="font-semibold text-gray-800">{formatDeadlineDisplay(deadlineAt)}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              日付を指定
            </button>
          </div>

          {/* カレンダー（日付指定） */}
          {showDatePicker && (
            <div className="pt-2 border-t">
              <input
                type="date"
                value={formatDateForInput(deadlineAt ?? getDefaultDeadline())}
                onChange={handleDateChange}
                min={formatDateForInput(minDate.toISOString())}
                max={formatDateForInput(maxDate.toISOString())}
                className="w-full p-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                ※ 1日〜30日後の範囲で設定できます
              </p>
            </div>
          )}
        </div>
      </div>

      {/* My Level */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
        <LevelSlider
          value={myLevel}
          onChange={(v) => setValue('myLevel', v)}
          label={selectedType === 'support' ? 'あなたのレベル（サポーターとして）' : 'あなたの現在レベル'}
        />
      </div>

      {/* Target Level Range */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
        <LevelRangeSlider
          minValue={targetLevelMin}
          maxValue={targetLevelMax}
          onMinChange={(v) => setValue('targetLevelMin', v)}
          onMaxChange={(v) => setValue('targetLevelMax', v)}
          label={selectedType === 'support' ? 'サポートしたい相手のレベル' : '希望するサポーターのレベル'}
        />
      </div>

      {/* Schedule Selector */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
        <Label>希望日程</Label>
        <ScheduleSelector
          availableDays={availableDays}
          availableTimes={availableTimes}
          specificDates={specificDates}
          onDaysChange={(days) => setValue('availableDays', days as any)}
          onTimesChange={(times) => setValue('availableTimes', times as any)}
          onDatesChange={(dates) => setValue('specificDates', dates)}
        />
      </div>

      {/* Max Applicants - Stepper */}
      <div className="space-y-2">
        <Label>募集人数</Label>
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl">
          <button
            type="button"
            onClick={() => {
              if (maxApplicants > 1) setValue('maxApplicants', maxApplicants - 1);
            }}
            disabled={maxApplicants <= 1}
            className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-2xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
          >
            −
          </button>
          <div className="w-24 text-center">
            <span className="text-3xl font-bold text-gray-800">{maxApplicants}</span>
            <span className="text-lg text-gray-500 ml-1">人</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (maxApplicants < 10) setValue('maxApplicants', maxApplicants + 1);
            }}
            disabled={maxApplicants >= 10}
            className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-2xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Online/Offline */}
      <div className="space-y-2">
        <Label>実施形式</Label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setValue('isOnline', null)}
            className={`p-3 rounded-xl border-2 transition-all ${
              isOnline === null
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">🤝 どちらでも</span>
          </button>
          <button
            type="button"
            onClick={() => setValue('isOnline', true)}
            className={`p-3 rounded-xl border-2 transition-all ${
              isOnline === true
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">🌐 オンライン</span>
          </button>
          <button
            type="button"
            onClick={() => setValue('isOnline', false)}
            className={`p-3 rounded-xl border-2 transition-all ${
              isOnline === false
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">📍 対面</span>
          </button>
        </div>
      </div>

      {/* Location (if offline) */}
      {isOnline === false && (
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Input
            id="location"
            placeholder="例: 東京都渋谷区"
            {...register('location')}
          />
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        投稿する
      </Button>
    </form>
  );
}