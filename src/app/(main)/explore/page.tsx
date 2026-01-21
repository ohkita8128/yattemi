'use client';

import { useState } from 'react';
import { PostList, PostFilters } from '@/components/posts';
import { usePosts, useCategories, useDebounce } from '@/hooks';
import type { PostType } from '@/types';

export default function ExplorePage() {
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { categories } = useCategories();
  const { posts, isLoading } = usePosts({
    type: selectedType,
    categoryId: selectedCategoryId,
    search: debouncedSearch,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">投稿を探す</h1>
          <p className="text-muted-foreground">
            気になるスキルや趣味を見つけてみましょう
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
          {/* Sidebar Filters */}
          <aside className="space-y-6">
            <PostFilters
              categories={categories}
              selectedType={selectedType}
              selectedCategoryId={selectedCategoryId}
              searchQuery={searchQuery}
              onTypeChange={setSelectedType}
              onCategoryChange={setSelectedCategoryId}
              onSearchChange={setSearchQuery}
            />
          </aside>

          {/* Posts Grid */}
          <main>
            <div className="mb-4 text-sm text-muted-foreground">
              {!isLoading && `${posts.length}件の投稿`}
            </div>
            <PostList
              posts={posts}
              isLoading={isLoading}
              emptyMessage="条件に合う投稿が見つかりませんでした"
            />
          </main>
        </div>
      </div>
    </div>
  );
}
