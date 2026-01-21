'use client';

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
import { postSchema, type PostFormData } from '@/lib/validations/post';
import { POST_TYPES } from '@/lib/constants';
import type { Category, PostType } from '@/types';

interface PostFormProps {
  categories: Category[];
  defaultType?: PostType;
  onSubmit: (data: PostFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function PostForm({
  categories,
  defaultType = 'teach',
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
      isOnline: true,
      tags: [],
    },
  });

  const selectedType = watch('type');
  const isOnline = watch('isOnline');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label required>投稿タイプ</Label>
        <div className="grid grid-cols-2 gap-4">
          {(['teach', 'learn'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type
                  ? type === 'teach'
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
          placeholder="どんなことを教えたい/学びたいですか？具体的に書くとマッチングしやすくなります。"
          className="min-h-[150px]"
          error={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
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

      {/* Max Applicants */}
      <div className="space-y-2">
        <Label htmlFor="maxApplicants">募集人数</Label>
        <Select
          defaultValue="1"
          onValueChange={(v) => setValue('maxApplicants', parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n}人
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Online/Offline */}
      <div className="space-y-2">
        <Label>実施形式</Label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setValue('isOnline', true)}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${
              isOnline
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">🌐 オンライン</span>
          </button>
          <button
            type="button"
            onClick={() => setValue('isOnline', false)}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${
              !isOnline
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-medium">📍 対面</span>
          </button>
        </div>
      </div>

      {/* Location (if offline) */}
      {!isOnline && (
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Input
            id="location"
            placeholder="例: 東京都渋谷区"
            {...register('location')}
          />
        </div>
      )}

      {/* Preferred Schedule */}
      <div className="space-y-2">
        <Label htmlFor="preferredSchedule">希望日程（任意）</Label>
        <Input
          id="preferredSchedule"
          placeholder="例: 平日夜、土日"
          {...register('preferredSchedule')}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        投稿する
      </Button>
    </form>
  );
}
