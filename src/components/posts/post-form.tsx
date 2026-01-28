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
    date.setHours(23, 59, 59, 999);
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

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type Selection - コンパクト */}
      <div className="space-y-1.5">
        <Label required>投稿タイプ</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['support', 'challenge'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                selectedType === type
                  ? type === 'support'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{POST_TYPES[type].emoji}</span>
                <span className="font-semibold text-sm">{POST_TYPES[type].label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" required>タイトル</Label>
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
      <div className="space-y-1.5">
        <Label htmlFor="description" required>詳細</Label>
        <Textarea
          id="description"
          placeholder="どんなことをサポート/チャレンジしたいですか？"
          className="min-h-[100px]"
          error={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Images - コンパクト */}
      <div className="space-y-1.5">
        <Label>画像（最大4枚）</Label>
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-orange-50">
              {uploadingImages ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5 text-gray-400" />
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
      <div className="space-y-1.5">
        <Label required>カテゴリ</Label>
        <Select onValueChange={(v) => setValue('categoryId', parseInt(v))}>
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

      {/* Deadline - コンパクト */}
      <div className="space-y-1.5">
        <Label>募集期限</Label>
        <div className="p-3 bg-gray-50 rounded-xl space-y-2">
          <div className="flex gap-1.5">
            {DEADLINE_PRESETS.map((preset) => {
              const presetDate = new Date();
              presetDate.setDate(presetDate.getDate() + preset.days);
              const isSelected = Math.abs(new Date(deadlineAt).getTime() - presetDate.getTime()) < 1000 * 60 * 60 * 24;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDeadlineByDays(preset.days)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
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
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              締切: <span className="font-medium text-gray-800">{formatDeadlineDisplay(deadlineAt)}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <Calendar className="h-3.5 w-3.5" />
              日付指定
            </button>
          </div>

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
            </div>
          )}
        </div>
      </div>

      {/* Level - 1つのカードにまとめる */}
      <div className="space-y-1.5">
        <Label>レベル設定</Label>
        <div className="p-3 bg-gray-50 rounded-xl space-y-4">
          <LevelSlider
            value={myLevel}
            onChange={(v) => setValue('myLevel', v)}
            label={selectedType === 'support' ? 'あなたのレベル' : '現在のレベル'}
          />
          <div className="border-t pt-3">
            <LevelRangeSlider
              minValue={targetLevelMin}
              maxValue={targetLevelMax}
              onMinChange={(v) => setValue('targetLevelMin', v)}
              onMaxChange={(v) => setValue('targetLevelMax', v)}
              label={selectedType === 'support' ? '相手のレベル' : '希望サポーターのレベル'}
            />
          </div>
        </div>
      </div>

      {/* Max Applicants + Online/Offline - 横並び */}
      <div className="grid grid-cols-2 gap-3">
        {/* 募集人数 - インライン */}
        <div className="space-y-1.5">
          <Label>募集人数</Label>
          <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-xl">
            <button
              type="button"
              onClick={() => {
                if (maxApplicants > 1) setValue('maxApplicants', maxApplicants - 1);
              }}
              disabled={maxApplicants <= 1}
              className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-lg font-medium text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              −
            </button>
            <div className="w-12 text-center">
              <span className="text-xl font-bold">{maxApplicants}</span>
              <span className="text-xs text-gray-500">人</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (maxApplicants < 10) setValue('maxApplicants', maxApplicants + 1);
              }}
              disabled={maxApplicants >= 10}
              className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-lg font-medium text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* 実施形式 - セレクト風 */}
        <div className="space-y-1.5">
          <Label>実施形式</Label>
          <Select
            value={isOnline === null ? 'both' : isOnline ? 'online' : 'offline'}
            onValueChange={(v) => {
              if (v === 'both') setValue('isOnline', null);
              else if (v === 'online') setValue('isOnline', true);
              else setValue('isOnline', false);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">🤝 どちらでも</SelectItem>
              <SelectItem value="online">🌐 オンライン</SelectItem>
              <SelectItem value="offline">📍 対面</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location (if offline) */}
      {isOnline === false && (
        <div className="space-y-1.5">
          <Label htmlFor="location">場所</Label>
          <Input
            id="location"
            placeholder="例: 東京都渋谷区"
            {...register('location')}
          />
        </div>
      )}

      {/* Schedule Selector */}
      <div className="space-y-1.5">
        <Label>希望日程</Label>
        <div className="p-3 bg-gray-50 rounded-xl">
          <ScheduleSelector
            availableDays={availableDays}
            availableTimes={availableTimes}
            specificDates={specificDates}
            onDaysChange={(days) => setValue('availableDays', days as any)}
            onTimesChange={(times) => setValue('availableTimes', times as any)}
            onDatesChange={(dates) => setValue('specificDates', dates)}
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        投稿する
      </Button>
    </form>
  );
}