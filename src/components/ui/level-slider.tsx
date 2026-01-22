'use client';

import { getLevelInfo } from '@/lib/levels';
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

  // 選択範囲のパーセンテージ計算
  const minPercent = (minValue / 10) * 100;
  const maxPercent = (maxValue / 10) * 100;

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

        {/* デュアルレンジスライダー */}
        <div className="relative h-2 mx-2">
          {/* ベースのトラック */}
          <div className="absolute w-full h-2 bg-gray-200 rounded-lg" />
          
          {/* 選択範囲のハイライト */}
          <div 
            className="absolute h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />

          {/* Min スライダー */}
          <input
            type="range"
            min={0}
            max={10}
            value={minValue}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
              [&::-webkit-slider-thumb]:pointer-events-auto
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-cyan-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-cyan-600
              [&::-moz-range-thumb]:pointer-events-auto
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:bg-cyan-500
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-cyan-600"
            style={{ zIndex: minValue === maxValue ? 2 : 1 }}
          />

          {/* Max スライダー */}
          <input
            type="range"
            min={0}
            max={10}
            value={maxValue}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
              [&::-webkit-slider-thumb]:pointer-events-auto
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-purple-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-purple-600
              [&::-moz-range-thumb]:pointer-events-auto
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:bg-purple-500
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-purple-600"
            style={{ zIndex: 2 }}
          />
        </div>

        {/* 両端のアイコン + レベル表示 */}
        <div className="flex justify-between text-sm px-1">
          <div className="flex items-center gap-1">
            <span>🐣</span>
            <span className="text-xs text-gray-500">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">10</span>
            <span>🥷</span>
          </div>
        </div>

        {/* 下限/上限ラベル */}
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-cyan-500 rounded-full inline-block" />
            下限: Lv.{minValue}
          </span>
          <span className="flex items-center gap-1">
            上限: Lv.{maxValue}
            <span className="w-3 h-3 bg-purple-500 rounded-full inline-block" />
          </span>
        </div>
      </div>
    </div>
  );
}
