// レベル定義
export const LEVELS = [
  { min: 0, max: 1, name: '見習い', emoji: '🐣' },
  { min: 2, max: 3, name: '初心者', emoji: '🌱' },
  { min: 4, max: 5, name: '中級者', emoji: '📚' },
  { min: 6, max: 7, name: '一人前', emoji: '🚶' },
  { min: 8, max: 9, name: '職人', emoji: '🔨' },
  { min: 10, max: 10, name: '達人', emoji: '🥷' },
] as const;

// レベル値からレベル情報を取得
export function getLevelInfo(level: number) {
  const info = LEVELS.find(l => level >= l.min && level <= l.max);
  return info || LEVELS[0];
}

// レベル表示用のラベル
export function getLevelLabel(level: number) {
  const info = getLevelInfo(level);
  return `${info.emoji} ${info.name}`;
}

// レベル範囲の表示
export function getLevelRangeLabel(min: number, max: number) {
  const minInfo = getLevelInfo(min);
  const maxInfo = getLevelInfo(max);
  
  if (minInfo.name === maxInfo.name) {
    return `${minInfo.emoji} ${minInfo.name}`;
  }
  
  return `${minInfo.emoji}${minInfo.name} 〜 ${maxInfo.emoji}${maxInfo.name}`;
}
