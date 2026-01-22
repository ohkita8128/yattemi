'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { PostCard, PostCardSkeleton } from '@/components/posts';
import { usePosts, useCategories, useDebounce } from '@/hooks';
import { getLevelInfo } from '@/lib/levels';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { categories } = useCategories();
  const { posts, isLoading } = usePosts({
    type: type === 'all' ? undefined : type,
    categoryId: categoryId || undefined,
    search: debouncedSearch || undefined,
  });

  // レベルフィルタリング（クライアント側）
  const filteredPosts = posts.filter((post) => {
    const postLevel = post.my_level ?? 5;
    return postLevel >= levelMin && postLevel <= levelMax;
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
  };

  const hasActiveFilters =
    type !== 'all' || categoryId !== null || searchQuery !== '' || levelMin > 0 || levelMax < 10;

  const minInfo = getLevelInfo(levelMin);
  const maxInfo = getLevelInfo(levelMax);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">投稿を探す</h1>
        <p className="text-gray-500">スキルを教えたい人・学びたい人を見つけよう</p>
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
                  {cat.icon} {cat.name}
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
              <PostCard key={post.id} post={post} />
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
