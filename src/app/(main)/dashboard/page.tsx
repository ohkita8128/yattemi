'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface DashboardPost {
  id: string;
  title: string;
  type: 'support' | 'challenge';
  applicants: {
    id: string;
    avatar_url: string | null;
    display_name: string;
  }[];
}

interface DashboardApplication {
  id: string;
  post_id: string;
  post_title: string;
  post_type: 'support' | 'challenge';
  status: string;
}

interface DashboardMatch {
  id: string;
  post_title: string;
  post_type: 'support' | 'challenge';
  partner: {
    id: string;
    avatar_url: string | null;
    display_name: string;
  };
  is_owner: boolean;
}

interface DashboardData {
  myPosts: DashboardPost[];
  myApplications: DashboardApplication[];
  myMatches: DashboardMatch[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    myPosts: [],
    myApplications: [],
    myMatches: [],
  });

  const supabaseRef = useRef(getClient());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      const supabase = supabaseRef.current;

      try {
        // 1. 自分の募集中の投稿 + 応募者
        const { data: myActivePosts } = await (supabase as any)
          .from('posts')
          .select(`
            id,
            title,
            type,
            applications (
              id,
              status,
              applicant:profiles!applications_applicant_id_fkey (
                id,
                avatar_url,
                display_name
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'open');

        const myPosts: DashboardPost[] = (myActivePosts || []).map((post: any) => ({
          id: post.id,
          title: post.title,
          type: post.type,
          applicants: (post.applications || [])
            .filter((app: any) => app.status === 'pending')
            .map((app: any) => ({
              id: app.applicant?.id || '',
              avatar_url: app.applicant?.avatar_url || null,
              display_name: app.applicant?.display_name || '',
            })),
        }));

        // 2. 自分の応募（返事待ち）
        const { data: pendingApps } = await (supabase as any)
          .from('applications')
          .select(`
            id,
            status,
            post:posts (
              id,
              title,
              type
            )
          `)
          .eq('applicant_id', user.id)
          .eq('status', 'pending');

        const myApplications: DashboardApplication[] = (pendingApps || []).map((app: any) => ({
          id: app.id,
          post_id: app.post?.id || '',
          post_title: app.post?.title || '',
          post_type: app.post?.type || 'support',
          status: app.status,
        }));

        // 3. マッチ中
        const { data: activeMatches } = await (supabase as any)
          .from('matches')
          .select(`
                id,
                status,
                application:applications (
                  id,
                  applicant_id,
                  post:posts (
                    id,
                    title,
                    type,
                    user_id,
                    owner:profiles!posts_user_id_fkey (
                      id,
                      avatar_url,
                      display_name
                    )
                  ),
                  applicant:profiles!applications_applicant_id_fkey (
                    id,
                    avatar_url,
                    display_name
                  )
                )
              `)
          .eq('status', 'active');

        const myMatches: DashboardMatch[] = (activeMatches || [])
          .filter((match: any) => {
            const postOwnerId = match.application?.post?.user_id;
            const applicantId = match.application?.applicant_id;
            return postOwnerId === user.id || applicantId === user.id;
          })
          .map((match: any) => {
            const post = match.application?.post;
            const applicant = match.application?.applicant;
            const owner = post?.owner;
            const isOwner = post?.user_id === user.id;

            // 自分が投稿者なら応募者が相手、自分が応募者なら投稿者が相手
            const partner = isOwner ? applicant : owner;

            return {
              id: match.id,
              post_title: post?.title || '',
              post_type: post?.type || 'support',
              partner: {
                id: partner?.id || '',
                avatar_url: partner?.avatar_url || null,
                display_name: partner?.display_name || '',
              },
              is_owner: isOwner,
            };
          });

        setDashboardData({
          myPosts,
          myApplications,
          myMatches,
        });

        // 4. 未読通知カウント
        const { count: unreadCount } = await (supabase as any)
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadNotificationCount(unreadCount || 0);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const MAX_COLLAPSED = 3;

  const supportPosts = dashboardData.myPosts.filter(p => p.type === 'support');
  const challengePosts = dashboardData.myPosts.filter(p => p.type === 'challenge');
  const supportApplications = dashboardData.myApplications.filter(a => a.post_type === 'support');
  const challengeApplications = dashboardData.myApplications.filter(a => a.post_type === 'challenge');
  const supportMatches = dashboardData.myMatches.filter(m => m.post_type === 'support');
  const challengeMatches = dashboardData.myMatches.filter(m => m.post_type === 'challenge');

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-lg font-bold mb-4">管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* サポートカード */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b bg-orange-50">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm">🎓</span>
            </div>
            <span className="font-bold">サポート</span>
          </div>

          {/* 募集中 */}
          <div className="border-b">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-orange-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">募集中</span>
            </div>
            {supportPosts.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {supportPosts
                  .slice(0, expandedSections['support-posts'] ? undefined : MAX_COLLAPSED)
                  .map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{post.title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {post.applicants.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {post.applicants.slice(0, 3).map((applicant, i) => (
                              <div
                                key={applicant.id || i}
                                className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden"
                              >
                                {applicant.avatar_url ? (
                                  <Image src={applicant.avatar_url} alt="" width={72} height={72} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-orange-400 flex items-center justify-center text-white text-[10px] font-bold">
                                    {applicant.display_name?.[0] || '?'}
                                  </div>
                                )}
                              </div>
                            ))}
                            {post.applicants.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-gray-400 border-2 border-white text-[10px] flex items-center justify-center text-white font-bold">
                                +{post.applicants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-gray-400">›</span>
                      </div>
                    </Link>
                  ))}
                {supportPosts.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('support-posts')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['support-posts'] ? '▲ 閉じる' : `▼ あと${supportPosts.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 応募中 */}
          <div className="border-b">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-blue-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">応募中</span>
            </div>
            {supportApplications.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {supportApplications
                  .slice(0, expandedSections['support-apps'] ? undefined : MAX_COLLAPSED)
                  .map((app) => (
                    <Link
                      key={app.id}
                      href={`/posts/${app.post_id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{app.post_title}</span>
                      <span className="text-gray-400">›</span>
                    </Link>
                  ))}
                {supportApplications.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('support-apps')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['support-apps'] ? '▲ 閉じる' : `▼ あと${supportApplications.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* サポート中 */}
          <div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-green-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">サポート中</span>
            </div>
            {supportMatches.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {supportMatches
                  .slice(0, expandedSections['support-matches'] ? undefined : MAX_COLLAPSED)
                  .map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{match.post_title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden">
                          {match.partner.avatar_url ? (
                            <Image src={match.partner.avatar_url} alt="" width={72} height={72} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-green-400 flex items-center justify-center text-white text-[10px] font-bold">
                              {match.partner.display_name?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-400">›</span>
                      </div>
                    </Link>
                  ))}
                {supportMatches.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('support-matches')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['support-matches'] ? '▲ 閉じる' : `▼ あと${supportMatches.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* チャレンジカード */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b bg-cyan-50">
            <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
              <span className="text-sm">📚</span>
            </div>
            <span className="font-bold">チャレンジ</span>
          </div>

          {/* 募集中 */}
          <div className="border-b">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-cyan-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">募集中</span>
            </div>
            {challengePosts.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {challengePosts
                  .slice(0, expandedSections['challenge-posts'] ? undefined : MAX_COLLAPSED)
                  .map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{post.title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {post.applicants.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {post.applicants.slice(0, 3).map((applicant, i) => (
                              <div
                                key={applicant.id || i}
                                className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden"
                              >
                                {applicant.avatar_url ? (
                                  <Image src={applicant.avatar_url} alt="" width={72} height={72} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-cyan-400 flex items-center justify-center text-white text-[10px] font-bold">
                                    {applicant.display_name?.[0] || '?'}
                                  </div>
                                )}
                              </div>
                            ))}
                            {post.applicants.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-gray-400 border-2 border-white text-[10px] flex items-center justify-center text-white font-bold">
                                +{post.applicants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-gray-400">›</span>
                      </div>
                    </Link>
                  ))}
                {challengePosts.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('challenge-posts')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['challenge-posts'] ? '▲ 閉じる' : `▼ あと${challengePosts.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 応募中 */}
          <div className="border-b">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-blue-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">応募中</span>
            </div>
            {challengeApplications.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {challengeApplications
                  .slice(0, expandedSections['challenge-apps'] ? undefined : MAX_COLLAPSED)
                  .map((app) => (
                    <Link
                      key={app.id}
                      href={`/posts/${app.post_id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{app.post_title}</span>
                      <span className="text-gray-400">›</span>
                    </Link>
                  ))}
                {challengeApplications.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('challenge-apps')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['challenge-apps'] ? '▲ 閉じる' : `▼ あと${challengeApplications.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* チャレンジ中 */}
          <div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
              <div className="w-1 h-4 bg-purple-400 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">チャレンジ中</span>
            </div>
            {challengeMatches.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">なし</p>
            ) : (
              <div className="divide-y">
                {challengeMatches
                  .slice(0, expandedSections['challenge-matches'] ? undefined : MAX_COLLAPSED)
                  .map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate flex-1 mr-3 text-xs">{match.post_title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden">
                          {match.partner.avatar_url ? (
                            <Image src={match.partner.avatar_url} alt="" width={72} height={72} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-purple-400 flex items-center justify-center text-white text-[10px] font-bold">
                              {match.partner.display_name?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-400">›</span>
                      </div>
                    </Link>
                  ))}
                {challengeMatches.length > MAX_COLLAPSED && (
                  <button
                    onClick={() => toggleSection('challenge-matches')}
                    className="w-full text-xs text-gray-500 hover:bg-gray-50 py-2"
                  >
                    {expandedSections['challenge-matches'] ? '▲ 閉じる' : `▼ あと${challengeMatches.length - MAX_COLLAPSED}件`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 通知 & 設定 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Link
          href="/notifications"
          className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span>🔔</span>
            <span className="font-medium">通知</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationCount > 0 && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                {unreadNotificationCount}
              </span>
            )}
            <span className="text-gray-400">›</span>
          </div>
        </Link>

        <Link
          href="/settings"
          className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span className="font-medium">設定</span>
          </div>
          <span className="text-gray-400">›</span>
        </Link>
      </div>

      {/* プロフィールへ */}
      <Link
        href={`/users/${profile?.username}`}
        className="block text-center text-sm text-orange-600 hover:underline py-2"
      >
        プロフィールを見る →
      </Link>
    </div>
  );
}