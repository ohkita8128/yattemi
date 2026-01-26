'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, User, Tag } from 'lucide-react';
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

const POPULAR_TAGS = ['初心者歓迎', 'オンラインOK', '対面希望', '単発OK', '経験者向け'];

const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateShort = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
};

const getTodayDate = (): string => toDateString(new Date());

const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateString(tomorrow);
};

const getWeekendDates = (): string[] => {
  const today = new Date();
  const dates: string[] = [];
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0) {
    dates.push(toDateString(today));
  } else if (dayOfWeek === 6) {
    dates.push(toDateString(today));
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + 1);
    dates.push(toDateString(sunday));
  } else {
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + (6 - dayOfWeek));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    dates.push(toDateString(saturday));
    dates.push(toDateString(sunday));
  }
  return dates;
};

const getTodayDayKey = (): string => {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return dayKeys[new Date().getDay()]!;
};

const getTomorrowDayKey = (): string => {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dayKeys[tomorrow.getDay()]!;
};

const getWeekendDayKeys = () => ['sat', 'sun'];

const getDayKeyFromDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return dayKeys[date.getDay()]!;
};

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabaseRef = useRef(getClient());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const initialType = (searchParams.get('type') as 'support' | 'challenge' | 'all') || 'all';
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('q') || '';

  const [type, setType] = useState<'support' | 'challenge' | 'all'>(initialType);
  const [categoryId, setCategoryId] = useState<number | null>(
    initialCategory ? Number(initialCategory) : null
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedPostIds, setAppliedPostIds] = useState<Set<string>>(new Set());

  // 投稿者レベルフィルタ（デュアルスライダー）
  const [posterLevelMin, setPosterLevelMin] = useState<number>(0);
  const [posterLevelMax, setPosterLevelMax] = useState<number>(10);
  const [myLevelFilter, setMyLevelFilter] = useState<number | null>(null);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [quickDateFilter, setQuickDateFilter] = useState<'today' | 'tomorrow' | 'weekend' | null>(null);
  const [targetDates, setTargetDates] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { categories } = useCategories();
  const { posts, isLoading, isLoadingMore, hasMore, loadMore } = usePosts({
    type: type === 'all' ? undefined : type,
    categoryId: categoryId || undefined,
    search: debouncedSearch || undefined,
    includeClosed,
  });

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

  const handleQuickDateFilter = (filter: 'today' | 'tomorrow' | 'weekend') => {
    setShowDatePicker(false);
    if (quickDateFilter === filter) {
      setQuickDateFilter(null);
      setSelectedDays([]);
      setTargetDates([]);
    } else {
      setQuickDateFilter(filter);
      switch (filter) {
        case 'today':
          setSelectedDays([getTodayDayKey()]);
          setTargetDates([getTodayDate()]);
          break;
        case 'tomorrow':
          setSelectedDays([getTomorrowDayKey()]);
          setTargetDates([getTomorrowDate()]);
          break;
        case 'weekend':
          setSelectedDays(getWeekendDayKeys());
          setTargetDates(getWeekendDates());
          break;
      }
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setQuickDateFilter(null);
    if (targetDates.includes(dateStr)) {
      const newDates = targetDates.filter(d => d !== dateStr);
      setTargetDates(newDates);
      setSelectedDays(newDates.map(d => getDayKeyFromDate(d)));
    } else {
      const newDates = [...targetDates, dateStr];
      setTargetDates(newDates);
      setSelectedDays(newDates.map(d => getDayKeyFromDate(d)));
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const toggleDay = (day: string) => {
    setQuickDateFilter(null);
    setTargetDates([]);
    setShowDatePicker(false);
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // 無限スクロール
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const filteredPosts = posts.filter((post) => {
    // 応募済みを非表示
    if (hideApplied && appliedPostIds.has(post.id)) return false;
    // 投稿者レベルフィルタ
    const postLevel = post.my_level ?? 5;
    if (postLevel < posterLevelMin || postLevel > posterLevelMax) return false;

    // 自分のレベルフィルタ（応募条件に合うか）
    if (myLevelFilter !== null) {
      const targetMin = (post as any).target_level_min ?? 0;
      const targetMax = (post as any).target_level_max ?? 10;
      if (myLevelFilter < targetMin || myLevelFilter > targetMax) return false;
    }

    if (locationFilter === 'online' && post.is_online === false) return false;
    if (locationFilter === 'offline' && post.is_online === true) return false;

    if (selectedDays.length > 0 || targetDates.length > 0) {
      const postDays = (post as any).available_days || [];
      const postSpecificDates = (post as any).specific_dates || [];
      const hasMatchingDay = selectedDays.length > 0 && selectedDays.some(day => postDays.includes(day));
      const hasMatchingDate = targetDates.length > 0 && postSpecificDates.some((sd: any) => targetDates.includes(sd.date));
      if (postDays.length === 0 && postSpecificDates.length === 0) {
      } else if (!hasMatchingDay && !hasMatchingDate) {
        return false;
      }
    }

    if (selectedTimes.length > 0) {
      const postTimes = (post as any).available_times || [];
      const hasMatchingTime = selectedTimes.some(time => postTimes.includes(time));
      if (postTimes.length > 0 && !hasMatchingTime) return false;
    }

    if (selectedTags.length > 0) {
      const postTags = (post as any).tags || [];
      const hasMatchingTag = selectedTags.some(tag => postTags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    return true;
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (categoryId) params.set('category', String(categoryId));
    if (searchQuery) params.set('q', searchQuery);
    if (posterLevelMin > 0) params.set('posterLevelMin', String(posterLevelMin));
    if (posterLevelMax < 10) params.set('posterLevelMax', String(posterLevelMax));
    if (myLevelFilter !== null) params.set('myLevel', String(myLevelFilter));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    const newUrl = params.toString() ? `?${params.toString()}` : '/explore';
    router.replace(newUrl, { scroll: false });
  }, [type, categoryId, searchQuery, posterLevelMin, posterLevelMax, myLevelFilter, selectedTags, router]);

  const clearFilters = () => {
    setType('all');
    setCategoryId(null);
    setSearchQuery('');
    setPosterLevelMin(0);
    setPosterLevelMax(10);
    setMyLevelFilter(null);
    setSelectedDays([]);
    setSelectedTimes([]);
    setLocationFilter('all');
    setQuickDateFilter(null);
    setTargetDates([]);
    setShowDatePicker(false);
    setSelectedTags([]);
    setTagInput('');
  };

  const hasActiveFilters = type !== 'all' || categoryId !== null || searchQuery !== '' || posterLevelMin > 0 || posterLevelMax < 10 || myLevelFilter !== null || selectedDays.length > 0 || selectedTimes.length > 0 || locationFilter !== 'all' || selectedTags.length > 0;

  const posterMinInfo = getLevelInfo(posterLevelMin);
  const posterMaxInfo = getLevelInfo(posterLevelMax);
  const myLevelInfo = myLevelFilter !== null ? getLevelInfo(myLevelFilter) : null;
  const calendarDays = generateCalendarDays();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">投稿を探す</h1>
        <p className="text-gray-500">スキルをサポートしたい人・チャレンジしたい人を見つけよう</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => handleQuickDateFilter('today')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${quickDateFilter === 'today' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📅 今日
        </button>
        <button
          onClick={() => handleQuickDateFilter('tomorrow')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${quickDateFilter === 'tomorrow' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📅 明日
        </button>
        <button
          onClick={() => handleQuickDateFilter('weekend')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${quickDateFilter === 'weekend' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🎉 今週末
        </button>
        <button
          onClick={() => {
            setShowDatePicker(!showDatePicker);
            if (!showDatePicker) setQuickDateFilter(null);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${showDatePicker || (targetDates.length > 0 && !quickDateFilter) ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🗓️ 日付を選ぶ
        </button>
      </div>

      {showDatePicker && (
        <div className="relative mb-4">
          <div className="bg-white rounded-xl border shadow-lg p-3 max-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-sm">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                <div key={d} className={`text-center text-xs py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((date, i) => {
                const dateStr = date ? toDateString(date) : '';
                const isSelected = date ? targetDates.includes(dateStr) : false;
                const isSelectable = date ? isDateSelectable(date) : false;
                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {date ? (
                      <button
                        type="button"
                        onClick={() => isSelectable && handleDateSelect(dateStr)}
                        disabled={!isSelectable}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : !isSelectable
                            ? 'text-gray-300 cursor-not-allowed'
                            : date.getDay() === 0
                            ? 'text-red-500 hover:bg-red-50'
                            : date.getDay() === 6
                            ? 'text-blue-500 hover:bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {targetDates.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {targetDates.sort().map(d => (
                    <span key={d} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                      {formatDateShort(d)}
                      <button onClick={() => handleDateSelect(d)} className="hover:text-orange-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードで検索..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      {/* ボトムシート オーバーレイ */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)} />
      )}

      {/* ボトムシート */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${showFilters ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
        style={{ maxHeight: '85vh' }}
      >
        {/* ハンドル */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <h3 className="text-lg font-bold">フィルター</h3>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-orange-500 hover:text-orange-600">
                クリア
              </button>
            )}
            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* フィルター内容 */}
        <div className="overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">タイプ</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'すべて', emoji: '📋' },
                { value: 'support', label: 'サポートしたい', emoji: '🎓' },
                { value: 'challenge', label: 'チャレンジしたい', emoji: '📚' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setType(option.value as 'support' | 'challenge' | 'all')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${type === option.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="mr-1">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${locationFilter === option.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
                      ? day.value === 'sat' ? 'bg-blue-500 text-white' : day.value === 'sun' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

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
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${selectedTimes.includes(time.value) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="mr-1">{time.emoji}</span>
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${categoryId === null ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                すべて
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${categoryId === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          {/* 表示オプション */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">表示オプション</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeClosed}
                  onChange={(e) => setIncludeClosed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">締め切り済みも表示</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideApplied}
                  onChange={(e) => setHideApplied(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">応募済みを非表示</span>
              </label>
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Tag className="h-4 w-4 inline mr-2" />
              タグで絞り込み
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="タグを入力してEnter..."
                className="flex-1 h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="px-4 h-10 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                追加
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-orange-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-2">よく使われるタグ:</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag) ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">🎓 投稿者のレベル</label>
            <div className="flex items-center justify-center gap-3 mb-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-xl">{posterMinInfo.emoji}</span>
              <span className="font-medium text-sm">{posterMinInfo.name}</span>
              <span className="text-gray-400">〜</span>
              <span className="text-xl">{posterMaxInfo.emoji}</span>
              <span className="font-medium text-sm">{posterMaxInfo.name}</span>
            </div>
            <div className="relative px-2 h-12">
              {/* 背景のトラック */}
              <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-2 bg-gray-200 rounded-full" />
              {/* アクティブ範囲 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                style={{
                  left: `calc(${(posterLevelMin / 10) * 100}% + 8px)`,
                  right: `calc(${((10 - posterLevelMax) / 10) * 100}% + 8px)`,
                }}
              />
              {/* 下限スライダー */}
              <input
                type="range"
                min={0}
                max={10}
                value={posterLevelMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= posterLevelMax) setPosterLevelMin(val);
                }}
                className="absolute top-1/2 -translate-y-1/2 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
              {/* 上限スライダー */}
              <input
                type="range"
                min={0}
                max={10}
                value={posterLevelMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= posterLevelMin) setPosterLevelMax(val);
                }}
                className="absolute top-1/2 -translate-y-1/2 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
              <span>🐣 Lv.0</span>
              <span>Lv.10 🥷</span>
            </div>
          </div>

          {/* 自分のレベル（応募条件マッチ） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <User className="h-4 w-4 inline mr-2" />
              自分のレベルで応募できる投稿を探す
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">私は</span>
              <select
                value={myLevelFilter ?? ''}
                onChange={(e) => setMyLevelFilter(e.target.value === '' ? null : Number(e.target.value))}
                className="h-10 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">指定なし</option>
                {[...Array(11)].map((_, i) => {
                  const info = getLevelInfo(i);
                  return (
                    <option key={i} value={i}>
                      Lv.{i} {info.emoji} {info.name}
                    </option>
                  );
                })}
              </select>
              <span className="text-gray-600">です</span>
              {myLevelInfo && (
                <span className="ml-2 text-2xl">{myLevelInfo.emoji}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 募集条件に自分のレベルが含まれる投稿だけを表示します
            </p>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="w-full py-2 text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2">
              <X className="h-4 w-4" />
              フィルターをクリア
            </button>
          )}
        </div>

        {/* 適用ボタン */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={() => setShowFilters(false)}
            className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            {filteredPosts.length}件の投稿を見る
          </button>
        </div>
      </div>

      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {type !== 'all' && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{type === 'support' ? '🎓 サポートしたい' : '📚 チャレンジしたい'}</span>}
          {locationFilter !== 'all' && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{locationFilter === 'online' ? '🌐 オンライン' : '📍 対面'}</span>}
          {targetDates.length > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{targetDates.map(d => formatDateShort(d)).join(', ')}</span>}
          {selectedDays.length > 0 && targetDates.length === 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{selectedDays.map(d => DAYS.find(day => day.value === d)?.label).join('・')}</span>}
          {selectedTimes.length > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{selectedTimes.map(t => TIMES.find(time => time.value === t)?.label).join('・')}</span>}
          {categoryId && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{categories.find((c) => c.id === categoryId)?.name}</span>}
          {selectedTags.length > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{selectedTags.map(t => `#${t}`).join(' ')}</span>}
          {(posterLevelMin > 0 || posterLevelMax < 10) && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">投稿者 Lv.{posterLevelMin}〜{posterLevelMax}</span>}
          {myLevelFilter !== null && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">自分 Lv.{myLevelFilter}</span>}
          {searchQuery && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">「{searchQuery}」</span>}
          <button onClick={clearFilters} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm">クリア</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (<PostCardSkeleton key={i} />))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">投稿が見つかりません</h2>
          <p className="text-gray-500 mb-6">検索条件を変更してみてください</p>
          {hasActiveFilters && (<button onClick={clearFilters} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">フィルターをクリア</button>)}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filteredPosts.length}件の投稿</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (<PostCard key={post.id} post={post} isApplied={appliedPostIds.has(post.id)} />))}
          </div>
          {/* 無限スクロールトリガー */}
          <div ref={loadMoreRef} className="py-8 flex flex-col items-center gap-4">
            {hasMore && !isLoadingMore && (
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                もっと見る
              </button>
            )}
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
                <span>読み込み中...</span>
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <p className="text-gray-400 text-sm">すべての投稿を表示しました</p>
            )}
          </div>
        </>
      )}

      {/* FAB フィルターボタン */}
      <button
        onClick={() => setShowFilters(true)}
        className="fixed bottom-6 right-6 z-30 h-14 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all bg-white text-gray-700 border hover:shadow-xl"
        style={{ display: showFilters ? 'none' : 'flex' }}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="font-medium">絞り込み</span>
        {hasActiveFilters && (
          <span className="ml-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">!</span>
        )}
      </button>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => (<PostCardSkeleton key={i} />))}</div></div>}>
      <ExploreContent />
    </Suspense>
  );
}
