'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, usePost } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { ROUTES, POST_TYPES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { LevelSlider, LevelRangeSlider } from '@/components/ui/level-slider';
import { TagInput } from '@/components/ui/tag-input';
import { ScheduleSelector } from '@/components/ui/schedule-selector';
import type { Category } from '@/types';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const { post, isLoading: postLoading } = usePost(postId);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabaseRef = useRef(getClient());

  // フォームの状態
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'teach' | 'learn'>('teach');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [maxApplicants, setMaxApplicants] = useState(1);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');

  // レベル関連
  const [myLevel, setMyLevel] = useState(5);
  const [targetLevelMin, setTargetLevelMin] = useState(0);
  const [targetLevelMax, setTargetLevelMax] = useState(10);

  // タグ
  const [tags, setTags] = useState<string[]>([]);

  // 日程関連
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [specificDates, setSpecificDates] = useState<{ date: string; start: string; end: string }[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApprovedMatch, setHasApprovedMatch] = useState(false);

  // カテゴリ取得
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('sort_order');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  // オーナーチェック & データセット
  useEffect(() => {
    if (post && user) {
      if (post.user_id !== user.id) {
        toast.error('この投稿を編集する権限がありません');
        router.push(ROUTES.EXPLORE);
        return;
      }
      setTitle(post.title);
      setDescription(post.description);
      setType(post.type);
      setCategoryId(post.category_id);
      setMaxApplicants(post.max_applicants);
      setIsOnline(post.is_online);
      setLocation(post.location || '');
      setStatus(post.status === 'open' ? 'open' : 'closed');
      setMyLevel(post.my_level ?? 5);
      setTargetLevelMin(post.target_level_min ?? 0);
      setTargetLevelMax(post.target_level_max ?? 10);
      setTags((post as any).tags || []);
      setAvailableDays((post as any).available_days || []);
      setAvailableTimes((post as any).available_times || []);
      setSpecificDates((post as any).specific_dates || []);
    }
  }, [post, user, router]);

  // 承認済みマッチングがあるかチェック
  useEffect(() => {
    const checkApprovedMatch = async () => {
      if (!postId) return;
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('matches')
        .select('id')
        .eq('post_id', postId)
        .limit(1);
      setHasApprovedMatch(data && data.length > 0);
    };
    checkApprovedMatch();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('タイトルと詳細を入力してください');
      return;
    }

    if (title.length < 5) {
      toast.error('タイトルは5文字以上で入力してください');
      return;
    }

    if (description.length < 10) {
      toast.error('詳細は10文字以上で入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = supabaseRef.current;
      const updateData: any = {
        title,
        description,
        status,
        my_level: myLevel,
        target_level_min: targetLevelMin,
        target_level_max: targetLevelMax,
        tags,
      };

      // 承認済みマッチングがなければ全項目更新可能
      if (!hasApprovedMatch) {
        updateData.type = type;
        updateData.category_id = categoryId;
        updateData.max_applicants = maxApplicants;
        updateData.is_online = isOnline;
        updateData.location = isOnline === false ? location : null;
        updateData.available_days = availableDays;
        updateData.available_times = availableTimes;
        updateData.specific_dates = specificDates;
      }

      const { error } = await (supabase as any).from('posts').update(updateData).eq('id', postId).single();

      if (error) throw error;

      toast.success('投稿を更新しました');
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこの投稿を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const supabase = supabaseRef.current;
      const { error } = await (supabase as any)
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('投稿を削除しました');
      router.push(ROUTES.EXPLORE);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('削除に失敗しました');
    }
  };

  if (authLoading || postLoading) {
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

  const isLocked = hasApprovedMatch;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/posts/${postId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h1 className="text-2xl font-bold">投稿を編集</h1>
        {isLocked && (
          <p className="text-sm text-amber-600 mt-2">
            ※ マッチング成立済みのため、一部の項目は変更できません
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 投稿タイプ */}
        <div className="space-y-2">
          <label className="block font-medium">
            投稿タイプ
            {isLocked && <span className="text-gray-400 text-sm ml-2">（変更不可）</span>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(['teach', 'learn'] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={isLocked}
                onClick={() => setType(t)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  type === t
                    ? t === 'teach'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-2xl mb-2 block">{POST_TYPES[t].emoji}</span>
                <span className="font-semibold block">{POST_TYPES[t].label}</span>
              </button>
            ))}
          </div>
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
            placeholder="例: Pythonの基礎を教えます！"
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
            rows={6}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="どんなことを教えたい/学びたいですか？具体的に書くとマッチングしやすくなります。"
          />
          <p className="text-xs text-gray-400">{description.length}/2000文字（10文字以上）</p>
        </div>

        {/* カテゴリ */}
        <div className="space-y-2">
          <label className="block font-medium">
            カテゴリ
            {isLocked && <span className="text-gray-400 text-sm ml-2">（変更不可）</span>}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            disabled={isLocked}
            className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
            }`}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* タグ */}
        <div className="space-y-2">
          <label className="block font-medium">タグ</label>
          <TagInput
            value={tags}
            onChange={setTags}
            maxTags={5}
          />
        </div>

        {/* 募集人数（ステッパー） */}
        <div className="space-y-2">
          <label className="block font-medium">
            募集人数
            {isLocked && <span className="text-gray-400 text-sm ml-2">（変更不可）</span>}
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (!isLocked && maxApplicants > 1) setMaxApplicants(maxApplicants - 1);
              }}
              disabled={isLocked || maxApplicants <= 1}
              className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-2xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
            >
              −
            </button>
            <div className="w-20 text-center">
              <span className="text-3xl font-bold text-gray-800">{maxApplicants}</span>
              <span className="text-lg text-gray-500 ml-1">人</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isLocked && maxApplicants < 10) setMaxApplicants(maxApplicants + 1);
              }}
              disabled={isLocked || maxApplicants >= 10}
              className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-orange-500 flex items-center justify-center text-2xl font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
            >
              +
            </button>
          </div>
        </div>

        {/* 実施形式（どちらでもOK対応） */}
        <div className="space-y-2">
          <label className="block font-medium">
            実施形式
            {isLocked && <span className="text-gray-400 text-sm ml-2">（変更不可）</span>}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setIsOnline(true)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isOnline === true
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="block font-medium">🌐 オンライン</span>
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setIsOnline(false)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isOnline === false
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="block font-medium">📍 対面</span>
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setIsOnline(null)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isOnline === null
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="block font-medium">🤝 どちらでも</span>
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
              disabled={isLocked}
              className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
              }`}
              placeholder="例: 東京都渋谷区"
            />
          </div>
        )}

        {/* 日程選択 */}
        <div className="space-y-2">
          <label className="block font-medium">
            希望日程
            {isLocked && <span className="text-gray-400 text-sm ml-2">（変更不可）</span>}
          </label>
          {isLocked ? (
            <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-sm">
              マッチング成立後は日程を変更できません
            </div>
          ) : (
            <ScheduleSelector
              availableDays={availableDays}
              availableTimes={availableTimes}
              specificDates={specificDates}
              onDaysChange={setAvailableDays}
              onTimesChange={setAvailableTimes}
              onDatesChange={setSpecificDates}
            />
          )}
        </div>

        {/* レベル設定 */}
        <div className="space-y-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700">レベル設定</h3>
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

        {/* ステータス */}
        <div className="space-y-2">
          <label className="block font-medium">募集ステータス</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStatus('open')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                status === 'open'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block font-medium">🟢 募集中</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('closed')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                status === 'closed'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block font-medium">⚫ 締め切り</span>
            </button>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? '更新中...' : '更新する'}
          </button>
        </div>

        {/* 削除ボタン */}
        <div className="pt-6 border-t">
          <button
            type="button"
            onClick={handleDelete}
            className="w-full h-12 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50"
          >
            この投稿を削除する
          </button>
        </div>
      </form>
    </div>
  );
}
