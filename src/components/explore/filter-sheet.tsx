'use client';

import { X, MapPin, Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import { DAYS, TIMES, LOCATION_OPTIONS, TYPE_OPTIONS } from '@/lib/constants/explore';
import { getLevelInfo } from '@/lib/levels';
import type { PostType, LocationFilter } from '@/hooks/use-explore-filters';
import type { Tag } from '@/hooks/use-tags';

interface Category {
  id: number;
  name: string;
}

interface FilterSheetProps {
  show: boolean;
  onClose: () => void;
  // Filters
  type: PostType;
  setType: (type: PostType) => void;
  locationFilter: LocationFilter;
  setLocationFilter: (filter: LocationFilter) => void;
  selectedDays: string[];
  toggleDay: (day: string) => void;
  selectedTimes: string[];
  toggleTime: (time: string) => void;
  categoryId: number | null;
  setCategoryId: (id: number | null) => void;
  categories: Category[];
  includeClosed: boolean;
  setIncludeClosed: (value: boolean) => void;
  hideApplied: boolean;
  setHideApplied: (value: boolean) => void;
  // Tags
  tagInput: string;
  setTagInput: (value: string) => void;
  selectedTags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  popularTags: Tag[];
  // Level
  posterLevelMin: number;
  setPosterLevelMin: (value: number) => void;
  posterLevelMax: number;
  setPosterLevelMax: (value: number) => void;
  myLevelFilter: number | null;
  setMyLevelFilter: (value: number | null) => void;
  // Actions
  hasActiveFilters: boolean;
  clearFilters: () => void;
  filteredCount: number;
}

export function FilterSheet({
  show,
  onClose,
  type,
  setType,
  locationFilter,
  setLocationFilter,
  selectedDays,
  toggleDay,
  selectedTimes,
  toggleTime,
  categoryId,
  setCategoryId,
  categories,
  includeClosed,
  setIncludeClosed,
  hideApplied,
  setHideApplied,
  tagInput,
  setTagInput,
  selectedTags,
  addTag,
  removeTag,
  popularTags,
  posterLevelMin,
  setPosterLevelMin,
  posterLevelMax,
  setPosterLevelMax,
  myLevelFilter,
  setMyLevelFilter,
  hasActiveFilters,
  clearFilters,
  filteredCount,
}: FilterSheetProps) {
  const posterMinInfo = getLevelInfo(posterLevelMin);
  const posterMaxInfo = getLevelInfo(posterLevelMax);
  const myLevelInfo = myLevelFilter !== null ? getLevelInfo(myLevelFilter) : null;

  return (
    <>
      {/* オーバーレイ */}
      {show && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      {/* ボトムシート */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${
          show ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
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
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* フィルター内容 */}
        <div className="overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* タイプ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">タイプ</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setType(option.value as PostType)}
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

          {/* 実施形式 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              実施形式
            </label>
            <div className="flex gap-2">
              {LOCATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocationFilter(option.value as LocationFilter)}
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

          {/* 希望曜日 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              希望曜日
            </label>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-8 h-8 rounded-full font-medium text-xs transition-all ${
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

          {/* 希望時間帯 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              <Clock className="h-4 w-4 inline mr-2" />
              希望時間帯
            </label>
            <div className="flex gap-2">
              {TIMES.map((time) => (
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
            <label className="block text-xs font-medium text-gray-600 mb-2">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  categoryId === null ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    categoryId === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 表示オプション */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">表示オプション</label>
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

          {/* タグ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              <TagIcon className="h-4 w-4 inline mr-2" />
              タグで絞り込み
            </label>
            <div className="flex gap-2 mb-2">
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
                placeholder="タグを入力..."
                className="min-w-0 flex-1 h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="px-3 h-9 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 whitespace-nowrap"
              >
                追加
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1"
                  >
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
                {popularTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.name)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag.name)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 投稿者レベル */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">🎓 投稿者のレベル</label>
            <div className="flex items-center justify-center gap-3 mb-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-xl">{posterMinInfo.emoji}</span>
              <span className="font-medium text-sm">{posterMinInfo.name}</span>
              <span className="text-gray-400">〜</span>
              <span className="text-xl">{posterMaxInfo.emoji}</span>
              <span className="font-medium text-sm">{posterMaxInfo.name}</span>
            </div>
            <div className="relative px-2 h-12">
              <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-2 bg-gray-200 rounded-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                style={{
                  left: `calc(${(posterLevelMin / 10) * 100}% + 8px)`,
                  right: `calc(${((10 - posterLevelMax) / 10) * 100}% + 8px)`,
                }}
              />
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

          {/* 自分のレベル */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
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
              {myLevelInfo && <span className="ml-2 text-2xl">{myLevelInfo.emoji}</span>}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 募集条件に自分のレベルが含まれる投稿だけを表示します
            </p>
          </div>

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

        {/* 適用ボタン */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            {filteredCount}件の投稿を見る
          </button>
        </div>
      </div>
    </>
  );
}