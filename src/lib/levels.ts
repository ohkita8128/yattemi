// レベル情報を取得
export function getLevelInfo(level: number): { name: string; emoji: string } {
  if (level <= 1) return { name: '見習い', emoji: '🐣' };
  if (level <= 3) return { name: '初心者', emoji: '🌱' };
  if (level <= 5) return { name: '中級者', emoji: '📚' };
  if (level <= 7) return { name: '一人前', emoji: '🚶' };
  if (level <= 9) return { name: '職人', emoji: '🔨' };
  return { name: '達人', emoji: '🥷' };
}

// レベルからラベルを取得
export function getLevelLabel(level: number): string {
  const info = getLevelInfo(level);
  return info.emoji + ' ' + info.name;
}

// レベルから絵文字のみを取得
export function getLevelEmoji(level: number): string {
  return getLevelInfo(level).emoji;
}
