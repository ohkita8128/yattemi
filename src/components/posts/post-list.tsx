'use client';

import { PostCard } from './post-card';
import { PostCardSkeletonGrid } from './post-card-skeleton';
import type { PostWithRelations } from '@/types';

interface PostListProps {
  posts: PostWithRelations[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PostList({ posts, isLoading, emptyMessage = '投稿がありません' }: PostListProps) {
  if (isLoading) {
    return <PostCardSkeletonGrid count={6} />;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
