'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { PostCard, PostCardSkeleton } from '@/components/posts';
import { SearchHeader } from '@/components/explore/search-header';
import { FilterSheet } from '@/components/explore/filter-sheet';
import { usePosts, useCategories, useDebounce } from '@/hooks';
import { useAuth } from '@/hooks';
import { useExploreFilters } from '@/hooks/use-explore-filters';
import { useTags } from '@/hooks/use-tags';
import { getClient } from '@/lib/supabase/client';
import { DAYS, TIMES } from '@/lib/constants/explore';
import { formatDateShort } from '@/lib/utils/explore-date';
import { useBlockedUsers } from '@/hooks/use-blocked-users';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabaseRef = useRef(getClient());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const initialType = (searchParams.get('type') as 'support' | 'challenge' | 'all') || 'all';
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('q') || '';

  const [showFilters, setShowFilters] = useState(false);
  const [appliedPostIds, setAppliedPostIds] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [statusLoaded, setStatusLoaded] = useState(false);
  const statusFetchedRef = useRef(false);  // ← 追加

  const filters = useExploreFilters(initialSearch, initialType, initialCategory ? Number(initialCategory) : null);
  const { popularTags } = useTags();
  const { categories } = useCategories();
  const blockedIds = useBlockedUsers();

  const debouncedSearch = useDebounce(filters.searchQuery, 300);
  const { posts, isLoading, isLoadingMore, hasMore, loadMore } = usePosts({
    type: filters.type === 'all' ? undefined : filters.type,
    categoryId: filters.categoryId || undefined,
    search: debouncedSearch || undefined,
    includeClosed: filters.includeClosed,
  });

  // 応募済み・いいね済み投稿を取得
  useEffect(() => {
    // 既に取得済みならスキップ
    if (statusFetchedRef.current) return;

    const fetchUserPostStatus = async () => {
      if (!user) {
        setAppliedPostIds(new Set());
        setLikedPostIds(new Set());
        setStatusLoaded(true);
        return;
      }

      statusFetchedRef.current = true;  // ← 追加

      const supabase = supabaseRef.current;

      const [applicationsResult, likesResult] = await Promise.all([
        (supabase as any)
          .from('applications')
          .select('post_id')
          .eq('applicant_id', user.id),
        (supabase as any)
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id),
      ]);

      if (applicationsResult.data) {
        setAppliedPostIds(new Set(applicationsResult.data.map((a: any) => a.post_id)));
      }
      if (likesResult.data) {
        setLikedPostIds(new Set(likesResult.data.map((l: any) => l.post_id)));
      }
      setStatusLoaded(true);
    };
    fetchUserPostStatus();
  }, [user?.id]);  // ← user → user?.id に変更

  // 無限スクロール
  useEffect(() => {
    if (isLoading) return;
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [isLoading, hasMore, isLoadingMore, loadMore]);

  // URLパラメータ同期
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.categoryId) params.set('category', String(filters.categoryId));
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    if (filters.posterLevelMin > 0) params.set('posterLevelMin', String(filters.posterLevelMin));
    if (filters.posterLevelMax < 10) params.set('posterLevelMax', String(filters.posterLevelMax));
    if (filters.myLevelFilter !== null) params.set('myLevel', String(filters.myLevelFilter));
    if (filters.selectedTags.length > 0) params.set('tags', filters.selectedTags.join(','));
    const newUrl = params.toString() ? `?${params.toString()}` : '/explore';
    router.replace(newUrl, { scroll: false });
  }, [filters.type, filters.categoryId, filters.searchQuery, filters.posterLevelMin, filters.posterLevelMax, filters.myLevelFilter, filters.selectedTags, router]);

  // フィルタリング
  const filteredPosts = posts.filter((post) => {
    // ブロックしたユーザーの投稿を除外
    if (blockedIds.includes(post.user_id)) return false;

    if (filters.hideApplied && appliedPostIds.has(post.id)) return false;

    const postLevel = post.my_level ?? 5;
    if (postLevel < filters.posterLevelMin || postLevel > filters.posterLevelMax) return false;

    if (filters.myLevelFilter !== null) {
      const targetMin = (post as any).target_level_min ?? 0;
      const targetMax = (post as any).target_level_max ?? 10;
      if (filters.myLevelFilter < targetMin || filters.myLevelFilter > targetMax) return false;
    }

    if (filters.locationFilter === 'online' && post.is_online === false) return false;
    if (filters.locationFilter === 'offline' && post.is_online === true) return false;

    if (filters.selectedDays.length > 0 || filters.targetDates.length > 0) {
      const postDays = (post as any).available_days || [];
      const postSpecificDates = (post as any).specific_dates || [];
      const hasMatchingDay = filters.selectedDays.length > 0 && filters.selectedDays.some(day => postDays.includes(day));
      const hasMatchingDate = filters.targetDates.length > 0 && postSpecificDates.some((sd: any) => filters.targetDates.includes(sd.date));
      if (postDays.length === 0 && postSpecificDates.length === 0) {
        // 何も指定してない投稿は通す
      } else if (!hasMatchingDay && !hasMatchingDate) {
        return false;
      }
    }

    if (filters.selectedTimes.length > 0) {
      const postTimes = (post as any).available_times || [];
      const hasMatchingTime = filters.selectedTimes.some(time => postTimes.includes(time));
      if (postTimes.length > 0 && !hasMatchingTime) return false;
    }

    if (filters.selectedTags.length > 0) {
      const postTags = (post as any).tags || [];
      const hasMatchingTag = filters.selectedTags.some(tag => postTags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pt-2">
      {/* 検索ヘッダー */}
      <SearchHeader
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        quickDateFilter={filters.quickDateFilter}
        handleQuickDateFilter={filters.handleQuickDateFilter}
        showDatePicker={filters.showDatePicker}
        setShowDatePicker={filters.setShowDatePicker}
        targetDates={filters.targetDates}
        handleDateSelect={filters.handleDateSelect}
      />

      {/* フィルターシート */}
      <FilterSheet
        show={showFilters}
        onClose={() => setShowFilters(false)}
        type={filters.type}
        setType={filters.setType}
        locationFilter={filters.locationFilter}
        setLocationFilter={filters.setLocationFilter}
        selectedDays={filters.selectedDays}
        toggleDay={filters.toggleDay}
        selectedTimes={filters.selectedTimes}
        toggleTime={filters.toggleTime}
        categoryId={filters.categoryId}
        setCategoryId={filters.setCategoryId}
        categories={categories}
        includeClosed={filters.includeClosed}
        setIncludeClosed={filters.setIncludeClosed}
        hideApplied={filters.hideApplied}
        setHideApplied={filters.setHideApplied}
        tagInput={filters.tagInput}
        setTagInput={filters.setTagInput}
        selectedTags={filters.selectedTags}
        addTag={filters.addTag}
        removeTag={filters.removeTag}
        popularTags={popularTags}
        posterLevelMin={filters.posterLevelMin}
        setPosterLevelMin={filters.setPosterLevelMin}
        posterLevelMax={filters.posterLevelMax}
        setPosterLevelMax={filters.setPosterLevelMax}
        myLevelFilter={filters.myLevelFilter}
        setMyLevelFilter={filters.setMyLevelFilter}
        hasActiveFilters={filters.hasActiveFilters}
        clearFilters={filters.clearFilters}
        filteredCount={filteredPosts.length}
      />

      {/* アクティブフィルター表示 */}
      {filters.hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.type !== 'all' && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.type === 'support' ? '🎓 サポートしたい' : '📚 チャレンジしたい'}
            </span>
          )}
          {filters.locationFilter !== 'all' && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.locationFilter === 'online' ? '🌐 オンライン' : '📍 対面'}
            </span>
          )}
          {filters.targetDates.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.targetDates.map(d => formatDateShort(d)).join(', ')}
            </span>
          )}
          {filters.selectedDays.length > 0 && filters.targetDates.length === 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.selectedDays.map(d => DAYS.find(day => day.value === d)?.label).join('・')}
            </span>
          )}
          {filters.selectedTimes.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.selectedTimes.map(t => TIMES.find(time => time.value === t)?.label).join('・')}
            </span>
          )}
          {filters.categoryId && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {categories.find((c) => c.id === filters.categoryId)?.name}
            </span>
          )}
          {filters.selectedTags.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {filters.selectedTags.map(t => `#${t}`).join(' ')}
            </span>
          )}
          {(filters.posterLevelMin > 0 || filters.posterLevelMax < 10) && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              投稿者 Lv.{filters.posterLevelMin}〜{filters.posterLevelMax}
            </span>
          )}
          {filters.myLevelFilter !== null && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              自分 Lv.{filters.myLevelFilter}
            </span>
          )}
          {filters.searchQuery && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              「{filters.searchQuery}」
            </span>
          )}
          <button onClick={filters.clearFilters} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm">
            クリア
          </button>
        </div>
      )}

      {/* 投稿一覧 */}
      {(isLoading || !statusLoaded) ? (
        <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">投稿が見つかりません</h2>
          <p className="text-gray-500 mb-6">検索条件を変更してみてください</p>
          {filters.hasActiveFilters && (
            <button onClick={filters.clearFilters} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              フィルターをクリア
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isApplied={appliedPostIds.has(post.id)}
                isLiked={statusLoaded ? likedPostIds.has(post.id) : undefined}
              />
            ))}
          </div>
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
        className="fixed bottom-20 right-4 z-30 h-14 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all bg-white text-gray-900 border hover:shadow-xl md:bottom-6 md:right-6"
        style={{ display: showFilters ? 'none' : 'flex' }}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="font-medium">絞り込み</span>
        {filters.hasActiveFilters && (
          <span className="ml-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
            !
          </span>
        )}
      </button>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
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