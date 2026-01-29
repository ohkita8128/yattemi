'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { PostCard } from '@/components/posts/post-card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Calendar,
  Loader2,
  Settings,
  MessageCircle,
  ImageIcon,
  FileText,
  User,
  MoreHorizontal,
  Flag,
  Ban,
} from 'lucide-react';
import { ReportDialog } from '@/components/common/report-dialog';

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  grade: string | null;
  created_at: string;
};

type ProfileImage = {
  id: string;
  user_id: string;
  url: string;
  position: number;
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  description?: string;
  type: 'support' | 'challenge';
  category_id: number | null;
  location_type: string | null;
  my_level: number | null;
  views: number;
  created_at: string;
  profiles: Profile | null;
  categories: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type Badge = {
  badge_type: string;
  count: number;
};

const BADGE_INFO: Record<string, { emoji: string; label: string }> = {
  clear: { emoji: '🎓', label: 'わかりやすい！' },
  helpful: { emoji: '💡', label: 'ためになった！' },
  godsenpai: { emoji: '🌟', label: '神サポーター！' },
  eager: { emoji: '🔥', label: '熱心だった！' },
  quicklearner: { emoji: '✨', label: 'のみこみ早い！' },
  hardworker: { emoji: '💪', label: 'がんばり屋！' },
  awesome: { emoji: '👏', label: '最高だった！' },
  thanks: { emoji: '💖', label: 'ありがとう！' },
  again: { emoji: '🤝', label: 'また会いたい！' },
};

const GRADE_LABELS: Record<string, string> = {
  '1': '1年生',
  '2': '2年生',
  '3': '3年生',
  '4': '4年生',
  '5': '修士1年',
  '6': '修士2年',
  '7': '博士課程',
  B1: '学部1年',
  B2: '学部2年',
  B3: '学部3年',
  B4: '学部4年',
  M1: '修士1年',
  M2: '修士2年',
  D: '博士課程',
  other: 'その他',
};

type TabType = 'gallery' | 'posts';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const supabaseRef = useRef(getClient());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileImages, setProfileImages] = useState<ProfileImage[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);  // ← 追加
  const [blockLoading, setBlockLoading] = useState(false);  // ← 追加
  useEffect(() => {
    const fetchData = async () => {
      const supabase = supabaseRef.current;

      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // プロフィール取得（これは最初に必要）
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // ✅ 残りは並列で取得！
      const [
        imagesResult,
        postsResult,
        reviewsResult,
        followersResult,
        followingResult,
        followStatusResult,
        blockStatusResult,
      ] = await Promise.all([
        // プロフィール画像
        (supabase as any)
          .from('profile_images')
          .select('*')
          .eq('user_id', profileData.id)
          .order('position', { ascending: true }),

        // 投稿
        (supabase as any)
          .from('posts')
          .select(`
          *,
          profiles (id, username, display_name, avatar_url, university),
          categories (id, name, slug)
        `)
          .eq('user_id', profileData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),

        // レビュー（バッジ用）
        (supabase as any)
          .from('reviews')
          .select('badges')
          .eq('reviewee_id', profileData.id),

        // フォロワー数
        (supabase as any)
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileData.id),

        // フォロー数
        (supabase as any)
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileData.id),

        // フォロー状態
        user ? (supabase as any)
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle() : Promise.resolve({ data: null }),

        // ブロック状態
        user ? (supabase as any)
          .from('blocks')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', profileData.id)
          .maybeSingle() : Promise.resolve({ data: null }),
      ]);



      // 結果をセット
      if (imagesResult.data) {
        setProfileImages(imagesResult.data);
      }

      if (postsResult.data) {
        setPosts(postsResult.data);
      }

      // バッジ処理
      if (reviewsResult.data) {
        const badgeCounts: Record<string, number> = {};
        reviewsResult.data.forEach((review: any) => {
          if (review.badges && Array.isArray(review.badges)) {
            review.badges.forEach((badge: string) => {
              badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
            });
          }
        });

        const badgeArray = Object.entries(badgeCounts)
          .map(([badge_type, count]) => ({ badge_type, count }))
          .sort((a, b) => b.count - a.count);

        setBadges(badgeArray);
      }

      setFollowersCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
      setIsFollowing(!!followStatusResult.data);
      setIsBlocked(!!blockStatusResult.data);

      setLoading(false);
    };

    fetchData();
  }, [username]);

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;

    setFollowLoading(true);
    const supabase = supabaseRef.current;

    try {
      if (isFollowing) {
        await (supabase as any)
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profile.id);

        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await (supabase as any)
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: profile.id,
          });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUserId || !profile) return;

    setBlockLoading(true);
    const supabase = supabaseRef.current;

    try {
      if (isBlocked) {
        await (supabase as any)
          .from('blocks')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', profile.id);
        setIsBlocked(false);
      } else {
        await (supabase as any)
          .from('blocks')
          .insert({ blocker_id: currentUserId, blocked_id: profile.id });
        setIsBlocked(true);
      }
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Block error:', error);
    } finally {
      setBlockLoading(false);
    }
  };

  // バッジの総数を計算
  const totalBadgeCount = badges.reduce((sum, b) => sum + b.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ユーザーが見つかりません</h1>
          <p className="text-gray-500 mb-4">このユーザーは存在しないか、削除されました。</p>
          <Link href="/explore">
            <Button>投稿を探す</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;
  const displayBadges = showAllBadges ? badges : badges.slice(0, 3);
  const hasMoreBadges = badges.length > 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* プロフィールヘッダー */}
        <div className="bg-white px-4 pt-6 pb-4">
          {/* アバター + 名前 + ボタン */}
          <div className="flex items-start gap-4 mb-4">
            {/* アバター（丸） */}
            <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || 'ユーザー'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-orange-400" />
              )}
            </div>

            {/* 名前とアクション */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {profile.display_name || 'ユーザー'}
                  </h1>
                  <p className="text-gray-500 text-sm">@{profile.username}</p>
                </div>

                {/* アクションボタン */}
                {isOwnProfile ? (
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                    >
                      {isFollowing ? 'フォロー中' : 'フォロー'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    {/* メニューボタン */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsMenuOpen(false)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border py-1 z-20">
                            {/* ブロックボタン追加 */}
                            <button
                              onClick={handleBlock}
                              disabled={blockLoading}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                            >
                              <Ban className="h-4 w-4" />
                              {isBlocked ? 'ブロック解除' : 'ブロック'}
                            </button>
                            <button
                              onClick={() => {
                                setIsMenuOpen(false);
                                setIsReportOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Flag className="h-4 w-4" />
                              通報
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 学校情報 */}
              {(profile.university || profile.department || profile.faculty) && (
                <div className="flex items-center gap-1 text-gray-600 text-sm mt-2">
                  <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {profile.university}
                    {(profile.department || profile.faculty) && ` ${profile.department || profile.faculty}`}
                  </span>
                </div>
              )}

              {profile.grade && (
                <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{GRADE_LABELS[profile.grade] || profile.grade}</span>
                </div>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {profile.bio && (
            <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* バッジ */}
          {badges.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {displayBadges.map((badge) => {
                  const info = BADGE_INFO[badge.badge_type];
                  if (!info) return null;
                  return (
                    <span
                      key={badge.badge_type}
                      className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-sm"
                    >
                      <span>{info.emoji}</span>
                      <span className="text-orange-500">×{badge.count}</span>
                    </span>
                  );
                })}
                {hasMoreBadges && !showAllBadges && (
                  <button
                    onClick={() => setShowAllBadges(true)}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-sm hover:bg-gray-200 transition"
                  >
                    +{badges.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 統計 */}
          <div className="flex items-center gap-4 py-3 border-t border-b text-sm">
            <Link
              href={`/users/${username}/follows?tab=followers`}
              className="hover:opacity-70"
            >
              <span className="font-bold">{followersCount}</span>
              <span className="text-gray-500 ml-1">フォロワー</span>
            </Link>
            <Link
              href={`/users/${username}/follows?tab=following`}
              className="hover:opacity-70"
            >
              <span className="font-bold">{followingCount}</span>
              <span className="text-gray-500 ml-1">フォロー中</span>
            </Link>
            {totalBadgeCount > 0 && (
              <div>
                <span className="font-bold">{totalBadgeCount}</span>
                <span className="text-gray-500 ml-1">バッジ</span>
              </div>
            )}
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white border-b sticky top-16 z-10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'posts'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <ImageIcon className="h-4 w-4" />
              ギャラリー
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'gallery'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <FileText className="h-4 w-4" />
              募集
              {posts.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {posts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="bg-white min-h-[300px]">
          {/* ギャラリータブ */}
          {activeTab === 'posts' && (
            <div className="p-4">
              {profileImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {profileImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square bg-gray-100 overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={`写真 ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-90 transition cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>まだ写真がありません</p>
                  {isOwnProfile && (
                    <Link href="/profile/edit">
                      <Button variant="outline" size="sm" className="mt-3">
                        写真を追加する
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 募集タブ */}
          {activeTab === 'gallery' && (
            <div className="p-4">
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        description: post.description ?? undefined,
                        profile: post.profiles ?? undefined,
                        profiles: undefined
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>まだ募集がありません</p>
                  {isOwnProfile && (
                    <Link href="/posts/create">
                      <Button variant="outline" size="sm" className="mt-3">
                        募集を作成する
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Report Dialog */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        type="user"
        targetId={profile.id}
      />
    </div>
  );
}
