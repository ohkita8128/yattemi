'use client';

import { useState } from 'react';
import { Plus, X, Calendar, Clock } from 'lucide-react';

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

export function ScheduleSelector({
  availableDays,
  availableTimes,
  specificDates,
  onDaysChange,
  onTimesChange,
  onDatesChange,
}: ScheduleSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('14:00');
  const [newEnd, setNewEnd] = useState('17:00');

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
    if (newDate && newStart && newEnd) {
      onDatesChange([...specificDates, { date: newDate, start: newStart, end: newEnd }]);
      setNewDate('');
      setShowDatePicker(false);
    }
  };

  const removeSpecificDate = (index: number) => {
    onDatesChange(specificDates.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}/${day}(${dayOfWeek})`;
  };

  // 今日から2週間分の日付を生成
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

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
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">日付</label>
                <select
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">選択してください</option>
                  {getDateOptions().map(date => (
                    <option key={date} value={date}>
                      {formatDate(date!)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full h-10 px-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">終了</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full h-10 px-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addSpecificDate}
                disabled={!newDate}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
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
