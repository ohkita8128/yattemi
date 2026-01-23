'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useCategories } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { ROUTES, POST_TYPES } from '@/lib/constants';
import { LevelSlider, LevelRangeSlider } from '@/components/ui/level-slider';
import { TagInput } from '@/components/ui/tag-input';
import { ScheduleSelector } from '@/components/ui/schedule-selector';

export default function NewPostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { categories } = useCategories();
  const supabase = getClient();

  // 基本情報
  const [type, setType] = useState<'teach' | 'learn'>('teach');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);

  // 詳細設定
  const [maxApplicants, setMaxApplicants] = useState(1);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [location, setLocation] = useState('');

  // レベル
  const [myLevel, setMyLevel] = useState(5);
  const [targetLevelMin, setTargetLevelMin] = useState(0);
  const [targetLevelMax, setTargetLevelMax] = useState(10);

  // タグ
  const [tags, setTags] = useState<string[]>([]);

  // 日程
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [specificDates, setSpecificDates] = useState<{ date: string; start: string; end: string }[]>([]);

  // UI状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    if (title.length < 5) {
      toast.error('タイトルは5文字以上で入力してください');
      return;
    }

    if (!description.trim()) {
      toast.error('詳細を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: post, error } = await (supabase as any)
        .from('posts')
        .insert({
          user_id: user?.id,
          type,
          title,
          description,
          category_id: categoryId,
          max_applicants: maxApplicants,
          is_online: isOnline,
          location: isOnline === false ? location : null,
          status: 'open',
          my_level: myLevel,
          target_level_min: targetLevelMin,
          target_level_max: targetLevelMax,
          tags,
          available_days: availableDays,
          available_times: availableTimes,
          specific_dates: specificDates,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('投稿しました！');
      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error('Post error:', error);
      toast.error('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold">新しい投稿</h1>
        <p className="text-gray-500 mt-1">スキルを教えたい・学びたいことを投稿しよう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 投稿タイプ */}
        <div className="space-y-2">
          <label className="block font-medium">投稿タイプ</label>
          <div className="grid grid-cols-2 gap-4">
            {(['teach', 'learn'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  type === t
                    ? t === 'teach'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">{POST_TYPES[t].emoji}</span>
                <span className="font-semibold block">{POST_TYPES[t].label}</span>
                <span className="text-sm text-gray-500">
                  {t === 'teach' ? '誰かに教えたい' : '誰かから学びたい'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリ */}
        <div className="space-y-2">
          <label className="block font-medium">カテゴリ</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* タイトル */}
        <div className="space-y-2">
          <label className="block font-medium">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={type === 'teach' ? '例: Pythonの基礎を教えます！' : '例: ギターを教えてほしい！'}
          />
          <p className="text-xs text-gray-400">{title.length}/100文字（5文字以上）</p>
        </div>

        {/* 詳細 */}
        <div className="space-y-2">
          <label className="block font-medium">
            詳細 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="どんなことを教えたい/学びたいですか？&#10;具体的に書くとマッチングしやすくなります。"
          />
          <p className="text-xs text-gray-400">{description.length}/2000文字</p>
        </div>

        {/* タグ */}
        <div className="space-y-2">
          <label className="block font-medium">タグ</label>
          <TagInput
            value={tags}
            onChange={setTags}
            maxTags={5}
            placeholder="タグを追加（例: 初心者歓迎）"
          />
        </div>

        {/* 実施形式 */}
        <div className="space-y-2">
          <label className="block font-medium">実施形式</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setIsOnline(null)}
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
              onClick={() => setIsOnline(true)}
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
              onClick={() => setIsOnline(false)}
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

        {/* 場所（対面の場合） */}
        {isOnline === false && (
          <div className="space-y-2">
            <label className="block font-medium">場所</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="例: 東京都渋谷区、名古屋駅周辺"
            />
          </div>
        )}

        {/* 日程 */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium mb-4">希望日程</h3>
          <ScheduleSelector
            availableDays={availableDays}
            availableTimes={availableTimes}
            specificDates={specificDates}
            onDaysChange={setAvailableDays}
            onTimesChange={setAvailableTimes}
            onDatesChange={setSpecificDates}
          />
        </div>

        {/* 詳細設定（折りたたみ） */}
        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium">詳細設定</span>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-6 border-t">
              {/* 募集人数 - ステッパー */}
              <div className="space-y-2">
                <label className="block font-medium">募集人数</label>
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (maxApplicants > 1) setMaxApplicants(maxApplicants - 1);
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
                      if (maxApplicants < 10) setMaxApplicants(maxApplicants + 1);
                    }}
                    disabled={maxApplicants >= 10}
                    className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-2xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* レベル設定 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">レベル設定</h4>
                
                <LevelSlider
                  value={myLevel}
                  onChange={setMyLevel}
                  label={type === 'teach' ? '自分のレベル（先輩として）' : '自分のレベル（学習者として）'}
                />

                <LevelRangeSlider
                  minValue={targetLevelMin}
                  maxValue={targetLevelMax}
                  onMinChange={setTargetLevelMin}
                  onMaxChange={setTargetLevelMax}
                  label={type === 'teach' ? '募集する後輩のレベル' : '希望する先輩のレベル'}
                />
              </div>
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-xl bg-orange-500 text-white font-semibold text-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </div>
  );
}
