'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Heart, MessageSquare, TrendingUp, Award, Eye } from 'lucide-react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalPosts: number;
  teachPosts: number;
  learnPosts: number;
  totalViews: number;
  totalLikes: number;
  followers: number;
  following: number;
  completedMatches: number;
  receivedBadges: { badge: string; count: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabaseRef = useRef(getClient());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const supabase = supabaseRef.current;

      try {
        // 投稿数
        const { data: posts } = await (supabase as any)
          .from('posts')
          .select('id, type, view_count')
          .eq('user_id', user.id);

        const totalPosts = posts?.length || 0;
        const teachPosts = posts?.filter((p: any) => p.type === 'support').length || 0;
        const learnPosts = posts?.filter((p: any) => p.type === 'challenge').length || 0;
        const totalViews = posts?.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0) || 0;

        // いいね数（自分の投稿についたいいね）
        const postIds = posts?.map((p: any) => p.id) || [];
        let totalLikes = 0;
        if (postIds.length > 0) {
          const { count } = await (supabase as any)
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds);
          totalLikes = count || 0;
        }

        // フォロワー/フォロー中
        const { count: followers } = await (supabase as any)
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        const { count: following } = await (supabase as any)
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        // 完了したマッチ数
        const { data: applications } = await (supabase as any)
          .from('applications')
          .select('id')
          .eq('applicant_id', user.id)
          .eq('status', 'accepted');

        const { data: myPostApps } = await (supabase as any)
          .from('applications')
          .select('id, post:posts!inner(user_id)')
          .eq('posts.user_id', user.id)
          .eq('status', 'accepted');

        const completedMatches = (applications?.length || 0) + (myPostApps?.length || 0);

        // 受け取ったバッジ
        const { data: reviews } = await (supabase as any)
          .from('reviews')
          .select('badges')
          .eq('reviewee_id', user.id);

        const badgeCounts: Record<string, number> = {};
        reviews?.forEach((r: any) => {
          r.badges?.forEach((b: string) => {
            badgeCounts[b] = (badgeCounts[b] || 0) + 1;
          });
        });

        const receivedBadges = Object.entries(badgeCounts)
          .map(([badge, count]) => ({ badge, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalPosts,
          teachPosts,
          learnPosts,
          totalViews,
          totalLikes,
          followers: followers || 0,
          following: following || 0,
          completedMatches,
          receivedBadges,
        });

        // 最近のアクティビティ（通知から取得）
        const { data: notifications } = await (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentActivity(notifications || []);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const badgeEmojis: Record<string, string> = {
    clear: '🎓',
    helpful: '💡',
    godsenpai: '🌟',
    eager: '🔥',
    quicklearner: '✨',
    hardworker: '💪',
    awesome: '👏',
    thanks: '💖',
    again: '🤝',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            profile?.display_name?.[0] || '?'
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile?.display_name}のダッシュボード</h1>
          <p className="text-gray-500">@{profile?.username}</p>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">投稿数</span>
            <BookOpen className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalPosts || 0}</p>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span>🎓 {stats?.teachPosts || 0}</span>
            <span>📚 {stats?.learnPosts || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">閲覧数</span>
            <Eye className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalViews || 0}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">いいね</span>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalLikes || 0}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">マッチング</span>
            <Users className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{stats?.completedMatches || 0}</p>
        </div>
      </div>

      {/* フォロー統計 */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Link
          href={`/users/${profile?.username}/follows?tab=followers`}
          className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">フォロワー</p>
              <p className="text-2xl font-bold">{stats?.followers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Link>

        <Link
          href={`/users/${profile?.username}/follows?tab=following`}
          className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">フォロー中</p>
              <p className="text-2xl font-bold">{stats?.following || 0}</p>
            </div>
            <Users className="h-8 w-8 text-cyan-500" />
          </div>
        </Link>
      </div>

      {/* 受け取ったバッジ */}
      {stats?.receivedBadges && stats.receivedBadges.length > 0 && (
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            受け取ったバッジ
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.receivedBadges.map(({ badge, count }) => (
              <div
                key={badge}
                className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full"
              >
                <span className="text-xl">{badgeEmojis[badge] || '🏅'}</span>
                <span className="font-medium">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近のアクティビティ */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          最近のアクティビティ
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだアクティビティがありません</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <Link
                key={activity.id}
                href={activity.link || '#'}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{activity.title}</p>
                  <p className="text-sm text-gray-500 truncate">{activity.message}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/notifications"
          className="block text-center text-orange-600 font-medium mt-4 hover:underline"
        >
          すべての通知を見る →
        </Link>
      </div>
    </div>
  );
}
