'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { ProfileImageViewer } from '@/components/profile/profile-image-viewer';
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
} from 'lucide-react';

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
  type: 'teach' | 'learn';
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
  godsenpai: { emoji: '🌟', label: '神先輩！' },
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
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = supabaseRef.current;

      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // プロフィール取得
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

      // プロフィール画像取得（カラム名修正: position）
      const { data: images } = await (supabase as any)
        .from('profile_images')
        .select('*')
        .eq('user_id', profileData.id)
        .order('position', { ascending: true });

      if (images) {
        setProfileImages(images);
      }

      // 投稿取得
      const { data: postsData } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          profiles (id, username, display_name, avatar_url, university),
          categories (id, name, slug)
        `)
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData);
      }

      // バッジ取得（受け取ったレビューからカウント）
      const { data: reviews } = await (supabase as any)
        .from('reviews')
        .select('badges')
        .eq('reviewee_id', profileData.id);

      if (reviews) {
        const badgeCounts: Record<string, number> = {};
        reviews.forEach((review: any) => {
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

      // フォロワー数
      const { count: followers } = await (supabase as any)
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      setFollowersCount(followers || 0);

      // フォロー数
      const { count: following } = await (supabase as any)
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowingCount(following || 0);

      // フォロー状態
      if (user) {
        const { data: followData } = await (supabase as any)
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .single();

        setIsFollowing(!!followData);
      }

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
        {/* プロフィール画像スライダー */}
        <ProfileImageViewer
          images={profileImages}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
        />

        {/* プロフィール情報 */}
        <div className="bg-white -mt-6 relative rounded-t-3xl px-4 pt-6 pb-4">
          {/* 名前とアクション */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.display_name || 'ユーザー'}
              </h1>
              <p className="text-gray-500">@{profile.username}</p>
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
              </div>
            )}
          </div>

          {/* 学校情報 */}
          {(profile.university || profile.department || profile.faculty) && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <span>
                {profile.university}
                {(profile.department || profile.faculty) && ` ${profile.department || profile.faculty}`}
              </span>
            </div>
          )}

          {profile.grade && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{GRADE_LABELS[profile.grade] || profile.grade}</span>
            </div>
          )}

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
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'gallery'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              ギャラリー
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'posts'
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
          {activeTab === 'gallery' && (
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
          {activeTab === 'posts' && (
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
    </div>
  );
}
