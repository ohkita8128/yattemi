'use client';

import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/use-follow';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ userId, className, size = 'md' }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId);

  // 自分自身の場合は表示しない
  if (!user || user.id === userId) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all',
        sizeClasses[size],
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
          : 'bg-orange-500 text-white hover:bg-orange-600',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : isFollowing ? (
        <>
          <UserMinus className={iconSizes[size]} />
          フォロー中
        </>
      ) : (
        <>
          <UserPlus className={iconSizes[size]} />
          フォロー
        </>
      )}
    </button>
  );
}
