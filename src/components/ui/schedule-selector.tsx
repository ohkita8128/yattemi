'use client';

import { useState } from 'react';
import { Plus, X, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleSelectorProps {
  availableDays: string[];
  availableTimes: string[];
  specificDates: { date: string; start: string; end: string }[];
  onDaysChange: (days: string[]) => void;
  onTimesChange: (times: string[]) => void;
  onDatesChange: (dates: { date: string; start: string; end: string }[]) => void;
}

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
  { value: 'morning', label: '朝', sub: '6:00-12:00', emoji: '🌅' },
  { value: 'afternoon', label: '昼', sub: '12:00-18:00', emoji: '☀️' },
  { value: 'evening', label: '夜', sub: '18:00-24:00', emoji: '🌙' },
];

// 日付をYYYY-MM-DD形式に変換（ローカルタイムゾーン）
const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ScheduleSelector({
  availableDays,
  availableTimes,
  specificDates,
  onDaysChange,
  onTimesChange,
  onDatesChange,
}: ScheduleSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      onDaysChange(availableDays.filter(d => d !== day));
    } else {
      onDaysChange([...availableDays, day]);
    }
  };

  const toggleTime = (time: string) => {
    if (availableTimes.includes(time)) {
      onTimesChange(availableTimes.filter(t => t !== time));
    } else {
      onTimesChange([...availableTimes, time]);
    }
  };

  const addSpecificDate = () => {
    if (selectedDate && newStart && newEnd) {
      onDatesChange([...specificDates, { date: selectedDate, start: newStart, end: newEnd }]);
      setSelectedDate(null);
      setShowDatePicker(false);
    }
  };

  const removeSpecificDate = (index: number) => {
    onDatesChange(specificDates.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year!, month! - 1, day);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${m}/${d}(${dayOfWeek})`;
  };

  // カレンダー生成
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

  const isDateAlreadyAdded = (date: Date) => {
    const dateStr = toDateString(date);
    return specificDates.some(d => d.date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date) || isDateAlreadyAdded(date)) return;
    setSelectedDate(toDateString(date));
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      {/* 曜日選択 */}
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
                availableDays.includes(day.value)
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

      {/* 時間帯選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock className="h-4 w-4 inline mr-2" />
          希望時間帯
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TIMES.map(time => (
            <button
              key={time.value}
              type="button"
              onClick={() => toggleTime(time.value)}
              className={`p-3 rounded-xl border-2 transition-all ${
                availableTimes.includes(time.value)
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl block mb-1">{time.emoji}</span>
              <span className="font-medium block">{time.label}</span>
              <span className="text-xs text-gray-500">{time.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 具体的な日時候補 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          具体的な日時候補（任意）
        </label>

        {/* 追加済みの日時 */}
        {specificDates.length > 0 && (
          <div className="space-y-2 mb-3">
            {specificDates.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-600">📅</span>
                  <span className="font-medium">{formatDate(item.date)}</span>
                  <span className="text-gray-500">
                    {item.start} 〜 {item.end}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSpecificDate(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 日時追加フォーム */}
        {showDatePicker ? (
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            {/* コンパクトカレンダー */}
            <div className="bg-white rounded-lg p-3 border max-w-[280px]">
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
                  const isSelected = date ? selectedDate === dateStr : false;
                  const isSelectable = date ? isDateSelectable(date) : false;
                  const isAdded = date ? isDateAlreadyAdded(date) : false;
                  
                  return (
                    <div key={i} className="aspect-square flex items-center justify-center">
                      {date ? (
                        <button
                          type="button"
                          onClick={() => handleDateClick(date)}
                          disabled={!isSelectable || isAdded}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : isAdded
                              ? 'bg-green-100 text-green-600 cursor-not-allowed'
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
            </div>

            {/* 時間選択 */}
            {selectedDate && (
              <div className="bg-white rounded-lg p-3 border max-w-[280px]">
                <p className="text-sm font-medium mb-2">
                  📅 {formatDate(selectedDate)} の時間
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">開始</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full h-9 px-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <span className="mt-5 text-gray-400">〜</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">終了</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full h-9 px-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 max-w-[280px]">
              <button
                type="button"
                onClick={addSpecificDate}
                disabled={!selectedDate}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker(false);
                  setSelectedDate(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            日時候補を追加
          </button>
        )}

        <p className="text-xs text-gray-500 mt-2">
          ※ 具体的な日時があるとマッチングしやすくなります
        </p>
      </div>
    </div>
  );
}

// 日程をテキストで表示するヘルパー
export function formatScheduleText(
  days: string[],
  times: string[],
  dates: { date: string; start: string; end: string }[]
): string {
  const parts: string[] = [];

  if (days.length > 0) {
    const dayLabels = days.map(d => DAYS.find(day => day.value === d)?.label).filter(Boolean);
    parts.push(dayLabels.join('・') + '曜');
  }

  if (times.length > 0) {
    const timeLabels = times.map(t => TIMES.find(time => time.value === t)?.label).filter(Boolean);
    parts.push(timeLabels.join('・'));
  }

  if (dates.length > 0) {
    parts.push(`${dates.length}件の日時候補あり`);
  }

  return parts.length > 0 ? parts.join(' / ') : '未設定';
}
