'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category, PostType } from '@/types';

interface PostFiltersProps {
  categories: Category[];
  selectedType: PostType | 'all';
  selectedCategoryId: number | null;
  searchQuery: string;
  onTypeChange: (type: PostType | 'all') => void;
  onCategoryChange: (categoryId: number | null) => void;
  onSearchChange: (query: string) => void;
}

export function PostFilters({
  categories,
  selectedType,
  selectedCategoryId,
  searchQuery,
  onTypeChange,
  onCategoryChange,
  onSearchChange,
}: PostFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="キーワードで検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Type Tabs */}
      <Tabs
        value={selectedType}
        onValueChange={(v) => onTypeChange(v as PostType | 'all')}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            すべて
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1">
            🎓 サポート
          </TabsTrigger>
          <TabsTrigger value="challenge" className="flex-1">
            📘 チャレンジ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category Select */}
      <Select
        value={selectedCategoryId?.toString() ?? 'all'}
        onValueChange={(v) => onCategoryChange(v === 'all' ? null : parseInt(v))}
      >
        <SelectTrigger>
          <SelectValue placeholder="カテゴリを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのカテゴリ</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
