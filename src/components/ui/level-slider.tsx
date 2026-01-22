'use client';

import { getLevelInfo, LEVELS } from '@/lib/levels';
import { cn } from '@/lib/utils';

interface LevelSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function LevelSlider({ 
  value, 
  onChange, 
  label = 'レベル',
  className 
}: LevelSliderProps) {
  const levelInfo = getLevelInfo(value);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {/* 現在のレベル表示 */}
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-3xl">{levelInfo.emoji}</span>
          <span className="text-lg font-bold">{levelInfo.name}</span>
          <span className="text-sm text-gray-500">(Lv.{value})</span>
        </div>

        {/* スライダー */}
        <div className="relative px-2">
          <input
            type="range"
            min={0}
            max={10}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          
          {/* 両端のアイコン */}
          <div className="flex justify-between mt-1 text-lg">
            <span>🐣</span>
            <span>🥷</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LevelRangeSliderProps {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function LevelRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  label = '対象レベル',
  className,
}: LevelRangeSliderProps) {
  const minInfo = getLevelInfo(minValue);
  const maxInfo = getLevelInfo(maxValue);

  const handleMinChange = (val: number) => {
    if (val <= maxValue) {
      onMinChange(val);
    }
  };

  const handleMaxChange = (val: number) => {
    if (val >= minValue) {
      onMaxChange(val);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="space-y-4">
        {/* 現在の範囲表示 */}
        <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg">
          <span className="text-2xl">{minInfo.emoji}</span>
          <span className="font-medium">{minInfo.name}</span>
          <span className="text-gray-400">〜</span>
          <span className="text-2xl">{maxInfo.emoji}</span>
          <span className="font-medium">{maxInfo.name}</span>
        </div>

        {/* Min スライダー */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>下限: {minInfo.emoji} {minInfo.name}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={minValue}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Max スライダー */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>上限: {maxInfo.emoji} {maxInfo.name}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={maxValue}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* 両端のアイコン */}
        <div className="flex justify-between text-lg px-1">
          <span>🐣</span>
          <span>🥷</span>
        </div>
      </div>
    </div>
  );
}
