'use client';

import { Heart } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  postId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({ postId, showCount = true, size = 'md' }: LikeButtonProps) {
  const { likesCount, isLiked, isLoading, toggleLike } = useLikes(postId);
  const { isAuthenticated } = useAuth();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      // ログインを促す（オプション）
      return;
    }
    toggleLike();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleClick}
        disabled={isLoading || !isAuthenticated}
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          sizeClasses[size],
          isLiked
            ? 'bg-red-50 text-red-500 hover:bg-red-100'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600',
          !isAuthenticated && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Heart
          className={cn(
            iconSizes[size],
            isLiked && 'fill-current'
          )}
        />
      </button>
      {showCount && (
        <span className={cn(
          'text-gray-500',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {likesCount}
        </span>
      )}
    </div>
  );
}
