'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal, Calendar, Clock, MapPin } from 'lucide-react';
import { PostCard, PostCardSkeleton } from '@/components/posts';
import { usePosts, useCategories, useDebounce } from '@/hooks';
import { useAuth } from '@/hooks';
import { getLevelInfo } from '@/lib/levels';
import { getClient } from '@/lib/supabase/client';

const DAYS = [
  { value: 'mon', label: '月' },
  { value: 'tue', label: '火' },
  { value: 'wed', label: '水' },
  { value: 'thu', label: '木' },
  { value: 'fri', label: '金' },
  { value: 'sat', label: '土' },
  { value: 'sun', label: '日' },
];

const TIMES = [
  { value: 'morning', label: '朝', emoji: '🌅' },
  { value: 'afternoon', label: '昼', emoji: '☀️' },
  { value: 'evening', label: '夜', emoji: '🌙' },
];

const LOCATION_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'online', label: '🌐 オンライン' },
  { value: 'offline', label: '📍 対面' },
];

// 今日の曜日を取得
const getTodayDayKey = (): string => {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return dayKeys[new Date().getDay()]!;
};

// 明日の曜日を取得
const getTomorrowDayKey = (): string => {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dayKeys[tomorrow.getDay()]!;
};

// 今週末（土日）を取得
const getWeekendDayKeys = () => ['sat', 'sun'];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabaseRef = useRef(getClient());

  const initialType = (searchParams.get('type') as 'teach' | 'learn' | 'all') || 'all';
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('q') || '';
  const initialLevelMin = searchParams.get('levelMin');
  const initialLevelMax = searchParams.get('levelMax');

  const [type, setType] = useState<'teach' | 'learn' | 'all'>(initialType);
  const [categoryId, setCategoryId] = useState<number | null>(
    initialCategory ? Number(initialCategory) : null
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [levelMin, setLevelMin] = useState<number>(initialLevelMin ? Number(initialLevelMin) : 0);
  const [levelMax, setLevelMax] = useState<number>(initialLevelMax ? Number(initialLevelMax) : 10);
  const [appliedPostIds, setAppliedPostIds] = useState<Set<string>>(new Set());

  // 新しいフィルタ
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [quickDateFilter, setQuickDateFilter] = useState<'today' | 'tomorrow' | 'weekend' | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { categories } = useCategories();
  const { posts, isLoading } = usePosts({
    type: type === 'all' ? undefined : type,
    categoryId: categoryId || undefined,
    search: debouncedSearch || undefined,
  });

  // 応募済み投稿IDを取得
  useEffect(() => {
    const fetchAppliedPosts = async () => {
      if (!user) {
        setAppliedPostIds(new Set());
        return;
      }

      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('applications')
        .select('post_id')
        .eq('applicant_id', user.id);

      if (data) {
        setAppliedPostIds(new Set(data.map((a: any) => a.post_id)));
      }
    };

    fetchAppliedPosts();
  }, [user]);

  // クイック日程フィルタの処理
  const handleQuickDateFilter = (filter: 'today' | 'tomorrow' | 'weekend') => {
    if (quickDateFilter === filter) {
      // 同じボタンをもう一度押したらクリア
      setQuickDateFilter(null);
      setSelectedDays([]);
    } else {
      setQuickDateFilter(filter);
      switch (filter) {
        case 'today':
          setSelectedDays([getTodayDayKey()]);
          break;
        case 'tomorrow':
          setSelectedDays([getTomorrowDayKey()]);
          break;
        case 'weekend':
          setSelectedDays(getWeekendDayKeys());
          break;
      }
    }
  };

  // 曜日トグル
  const toggleDay = (day: string) => {
    setQuickDateFilter(null); // クイックフィルタを解除
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // 時間帯トグル
  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  // フィルタリング（クライアント側）
  const filteredPosts = posts.filter((post) => {
    // レベルフィルタ
    const postLevel = post.my_level ?? 5;
    if (postLevel < levelMin || postLevel > levelMax) return false;

    // オンライン/対面フィルタ
    if (locationFilter === 'online' && !post.is_online) return false;
    if (locationFilter === 'offline' && post.is_online) return false;

    // 曜日フィルタ
    if (selectedDays.length > 0) {
      const postDays = (post as any).available_days || [];
      const hasMatchingDay = selectedDays.some(day => postDays.includes(day));
      // 曜日が設定されてない投稿も表示（フィルタに含めない選択もあり）
      if (postDays.length > 0 && !hasMatchingDay) return false;
    }

    // 時間帯フィルタ
    if (selectedTimes.length > 0) {
      const postTimes = (post as any).available_times || [];
      const hasMatchingTime = selectedTimes.some(time => postTimes.includes(time));
      if (postTimes.length > 0 && !hasMatchingTime) return false;
    }

    return true;
  });

  // URLパラメータを更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (categoryId) params.set('category', String(categoryId));
    if (searchQuery) params.set('q', searchQuery);
    if (levelMin > 0) params.set('levelMin', String(levelMin));
    if (levelMax < 10) params.set('levelMax', String(levelMax));

    const newUrl = params.toString() ? `?${params.toString()}` : '/explore';
    router.replace(newUrl, { scroll: false });
  }, [type, categoryId, searchQuery, levelMin, levelMax, router]);

  const clearFilters = () => {
    setType('all');
    setCategoryId(null);
    setSearchQuery('');
    setLevelMin(0);
    setLevelMax(10);
    setSelectedDays([]);
    setSelectedTimes([]);
    setLocationFilter('all');
    setQuickDateFilter(null);
  };

  const hasActiveFilters =
    type !== 'all' ||
    categoryId !== null ||
    searchQuery !== '' ||
    levelMin > 0 ||
    levelMax < 10 ||
    selectedDays.length > 0 ||
    selectedTimes.length > 0 ||
    locationFilter !== 'all';

  const minInfo = getLevelInfo(levelMin);
  const maxInfo = getLevelInfo(levelMax);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">投稿を探す</h1>
        <p className="text-gray-500">スキルを教えたい人・学びたい人を見つけよう</p>
      </div>

      {/* クイック日程フィルタ */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => handleQuickDateFilter('today')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            quickDateFilter === 'today'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          📅 今日
        </button>
        <button
          onClick={() => handleQuickDateFilter('tomorrow')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            quickDateFilter === 'tomorrow'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          📅 明日
        </button>
        <button
          onClick={() => handleQuickDateFilter('weekend')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            quickDateFilter === 'weekend'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          🎉 今週末
        </button>
      </div>

      {/* 検索バー */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードで検索..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-4 rounded-xl border flex items-center gap-2 transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-orange-500 text-white border-orange-500'
              : 'hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden sm:inline">フィルター</span>
          {hasActiveFilters && (
            <span className="h-5 w-5 rounded-full bg-white text-orange-500 text-xs font-bold flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-6 mb-6 space-y-6">
          {/* タイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">タイプ</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'すべて', emoji: '📋' },
                { value: 'teach', label: '教えたい', emoji: '🎓' },
                { value: 'learn', label: '学びたい', emoji: '📚' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setType(option.value as 'teach' | 'learn' | 'all')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    type === option.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* オンライン/対面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <MapPin className="h-4 w-4 inline mr-2" />
              実施形式
            </label>
            <div className="flex gap-2">
              {LOCATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocationFilter(option.value as any)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    locationFilter === option.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 曜日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="h-4 w-4 inline mr-2" />
              希望曜日
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full font-medium text-sm transition-all ${
                    selectedDays.includes(day.value)
                      ? day.value === 'sat'
                        ? 'bg-blue-500 text-white'
                        : day.value === 'sun'
                        ? 'bg-red-500 text-white'
                        : 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* 時間帯 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock className="h-4 w-4 inline mr-2" />
              希望時間帯
            </label>
            <div className="flex gap-2">
              {TIMES.map(time => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => toggleTime(time.value)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    selectedTimes.includes(time.value)
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{time.emoji}</span>
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  categoryId === null
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    categoryId === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* レベル範囲 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              レベル範囲
            </label>
            <div className="flex items-center justify-center gap-3 mb-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-xl">{minInfo.emoji}</span>
              <span className="font-medium">{minInfo.name}</span>
              <span className="text-gray-400">〜</span>
              <span className="text-xl">{maxInfo.emoji}</span>
              <span className="font-medium">{maxInfo.name}</span>
            </div>

            <div className="space-y-4 px-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>下限: Lv.{levelMin}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={levelMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= levelMax) setLevelMin(val);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>上限: Lv.{levelMax}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={levelMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= levelMin) setLevelMax(val);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span>🐣 Lv.0</span>
                <span>Lv.10 🥷</span>
              </div>
            </div>
          </div>

          {/* フィルターをクリア */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              フィルターをクリア
            </button>
          )}
        </div>
      )}

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {type !== 'all' && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {type === 'teach' ? '🎓 教えたい' : '📚 学びたい'}
            </span>
          )}
          {locationFilter !== 'all' && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {locationFilter === 'online' ? '🌐 オンライン' : '📍 対面'}
            </span>
          )}
          {selectedDays.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {selectedDays.map(d => DAYS.find(day => day.value === d)?.label).join('・')}
            </span>
          )}
          {selectedTimes.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {selectedTimes.map(t => TIMES.find(time => time.value === t)?.label).join('・')}
            </span>
          )}
          {categoryId && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {categories.find((c) => c.id === categoryId)?.name}
            </span>
          )}
          {(levelMin > 0 || levelMax < 10) && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              Lv.{levelMin}〜{levelMax}
            </span>
          )}
          {searchQuery && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              「{searchQuery}」
            </span>
          )}
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm"
          >
            クリア
          </button>
        </div>
      )}

      {/* 投稿一覧 */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">投稿が見つかりません</h2>
          <p className="text-gray-500 mb-6">
            検索条件を変更してみてください
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filteredPosts.length}件の投稿</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isApplied={appliedPostIds.has(post.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
