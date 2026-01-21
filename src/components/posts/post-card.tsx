'use client';

import Link from 'next/link';
import { MapPin, Users, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostTypeBadge } from './post-type-badge';
import { CategoryBadge } from '@/components/common/category-badge';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import type { PostWithRelations } from '@/types';

interface PostCardProps {
  post: PostWithRelations;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={ROUTES.POST_DETAIL(post.id)}>
      <Card hoverable className="h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <PostTypeBadge type={post.type} size="sm" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {post.description}
          </p>

          {/* Category */}
          <div className="mb-4">
            <CategoryBadge category={post.category} size="sm" />
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
            {post.is_online ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                オンライン可
              </span>
            ) : post.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.location}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {post.max_applicants}人募集
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={post.profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {post.profile.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {post.profile.display_name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
