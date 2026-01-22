'use client';

import { 
  BADGES_FOR_SENPAI, 
  BADGES_FOR_KOUHAI, 
  BadgeKey,
  ReviewerRole 
} from '@/hooks/use-reviews';
import { cn } from '@/lib/utils';

interface BadgeSelectorProps {
  selected: BadgeKey[];
  onChange: (badges: BadgeKey[]) => void;
  /** 自分の役割（先輩なら後輩用バッジ、後輩なら先輩用バッジを表示） */
  myRole: ReviewerRole;
  maxSelection?: number;
}

export function BadgeSelector({ 
  selected, 
  onChange, 
  myRole,
  maxSelection = 3 
}: BadgeSelectorProps) {
  // 自分が先輩 → 後輩に送る → BADGES_FOR_KOUHAI
  // 自分が後輩 → 先輩に送る → BADGES_FOR_SENPAI
  const badges = myRole === 'senpai' ? BADGES_FOR_KOUHAI : BADGES_FOR_SENPAI;
  const targetLabel = myRole === 'senpai' ? '後輩' : '先輩';

  const toggleBadge = (key: BadgeKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter(b => b !== key));
    } else if (selected.length < maxSelection) {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {targetLabel}にバッジを贈ろう！（最大{maxSelection}つ）
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(badges) as [BadgeKey, { emoji: string; label: string }][]).map(
          ([key, badge]) => {
            const isSelected = selected.includes(key);
            const isDisabled = !isSelected && selected.length >= maxSelection;

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleBadge(key)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-2xl">{badge.emoji}</span>
                <span className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-orange-700' : 'text-gray-700'
                )}>
                  {badge.label}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
