'use client';

import { useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toDateString, formatDateShort, isDateSelectable, generateCalendarDays } from '@/lib/utils/explore-date';
import type { QuickDateFilter } from '@/hooks/use-explore-filters';

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  quickDateFilter: QuickDateFilter;
  handleQuickDateFilter: (filter: 'today' | 'tomorrow' | 'weekend') => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
  targetDates: string[];
  handleDateSelect: (dateStr: string) => void;
}

export function SearchHeader({
  searchQuery,
  setSearchQuery,
  quickDateFilter,
  handleQuickDateFilter,
  showDatePicker,
  setShowDatePicker,
  targetDates,
  handleDateSelect,
}: SearchHeaderProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarDays = generateCalendarDays(currentMonth);

  return (
    <div className="sticky top-16 z-20 bg-white-50 -mx-4 px-4 py-2">
      {/* 検索バー */}
      <div className="max-w-sm mx-auto mb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className="w-full h-9 pl-10 pr-3 rounded-full bg-white border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* 日付ボタン */}
      <div className="flex justify-center gap-1.5">
        <button
          onClick={() => handleQuickDateFilter('today')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            quickDateFilter === 'today' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          今日
        </button>
        <button
          onClick={() => handleQuickDateFilter('tomorrow')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            quickDateFilter === 'tomorrow' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          明日
        </button>
        <button
          onClick={() => handleQuickDateFilter('weekend')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            quickDateFilter === 'weekend' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          週末
        </button>
        <button
          onClick={() => {
            setShowDatePicker(!showDatePicker);
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            showDatePicker || (targetDates.length > 0 && !quickDateFilter)
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          日付
        </button>
      </div>

      {/* カレンダー */}
      {showDatePicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDatePicker(false)}
          />
          <div className="flex justify-center mt-2 relative z-20">
            <div className="bg-white rounded-lg shadow-lg p-3 w-[280px]">
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
                  <div
                    key={d}
                    className={`text-center text-xs py-1 ${
                      i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date, i) => {
                  const dateStr = date ? toDateString(date) : '';
                  const isSelected = date ? targetDates.includes(dateStr) : false;
                  const selectable = date ? isDateSelectable(date) : false;
                  return (
                    <div key={i} className="aspect-square flex items-center justify-center">
                      {date ? (
                        <button
                          type="button"
                          onClick={() => selectable && handleDateSelect(dateStr)}
                          disabled={!selectable}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : !selectable
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
                    {targetDates.sort().map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1"
                      >
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
        </>
      )}
    </div>
  );
}