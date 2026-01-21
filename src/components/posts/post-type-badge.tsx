'use client';

import { cn } from '@/lib/utils';
import { POST_TYPES } from '@/lib/constants';
import type { PostType } from '@/types';

interface PostTypeBadgeProps {
  type: PostType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PostTypeBadge({ type, size = 'md', className }: PostTypeBadgeProps) {
  const config = POST_TYPES[type];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        type === 'teach'
          ? 'bg-purple-100 text-purple-700'
          : 'bg-cyan-100 text-cyan-700',
        sizeClasses[size],
        className
      )}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
