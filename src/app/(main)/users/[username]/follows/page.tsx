'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface UserItem {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function FollowListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const tab = searchParams.get('tab') || 'followers';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const supabaseRef = useRef(getClient());

  // 対象ユーザー情報を取得
  useEffect(() => {
    const fetchTargetUser = async () => {
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('username', username)
        .single();
      
      if (data) setTargetUser(data);
    };
    fetchTargetUser();
  }, [username]);

  // フォロワー/フォロー中を取得
  useEffect(() => {
    if (!targetUser) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      const supabase = supabaseRef.current;

      try {
        if (tab === 'followers') {
          // フォロワー一覧
          const { data } = await (supabase as any)
            .from('follows')
            .select(`
              follower:profiles!follows_follower_id_fkey(
                id, username, display_name, avatar_url, bio
              )
            `)
            .eq('following_id', targetUser.id);

          setUsers(data?.map((d: any) => d.follower).filter(Boolean) || []);
        } else {
          // フォロー中一覧
          const { data } = await (supabase as any)
            .from('follows')
            .select(`
              following:profiles!follows_following_id_fkey(
                id, username, display_name, avatar_url, bio
              )
            `)
            .eq('follower_id', targetUser.id);

          setUsers(data?.map((d: any) => d.following).filter(Boolean) || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [targetUser, tab]);

  // 自分がフォローしてるユーザーを取得
  useEffect(() => {
    if (!user) return;

    const fetchMyFollowing = async () => {
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (data) {
        setFollowingIds(new Set(data.map((d: any) => d.following_id)));
      }
    };

    fetchMyFollowing();
  }, [user]);

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    const supabase = supabaseRef.current;

    if (followingIds.has(targetId)) {
      // アンフォロー
      await (supabase as any)
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetId);

      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } else {
      // フォロー
      await (supabase as any)
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetId });

      setFollowingIds((prev) => new Set(prev).add(targetId));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={`/users/${username}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {targetUser?.display_name || username} のプロフィールに戻る
        </Link>
      </div>

      {/* タブ */}
      <div className="flex border-b mb-6">
        <Link
          href={`/users/${username}/follows?tab=followers`}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
            tab === 'followers'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          フォロワー
        </Link>
        <Link
          href={`/users/${username}/follows?tab=following`}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
            tab === 'following'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserPlus className="h-4 w-4 inline mr-2" />
          フォロー中
        </Link>
      </div>

      {/* ユーザーリスト */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {tab === 'followers' ? 'フォロワーはまだいません' : 'フォロー中のユーザーはいません'}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-shadow"
            >
              <Link href={`/users/${u.username}`}>
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium overflow-hidden">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    u.display_name[0]
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/users/${u.username}`}>
                  <p className="font-semibold truncate hover:text-orange-600">
                    {u.display_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">@{u.username}</p>
                </Link>
                {u.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{u.bio}</p>
                )}
              </div>

              {user && user.id !== u.id && (
                <button
                  onClick={() => handleFollow(u.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    followingIds.has(u.id)
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {followingIds.has(u.id) ? 'フォロー中' : 'フォロー'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
