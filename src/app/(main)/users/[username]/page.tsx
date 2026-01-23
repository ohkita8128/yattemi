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
  BookOpen, 
  Sparkles,
  Loader2,
  Settings,
  MessageCircle
} from 'lucide-react';

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  faculty: string | null;
  grade: string | null;
  created_at: string;
};

type ProfileImage = {
  id: string;
  user_id: string;
  image_url: string;
  sort_order: number;
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
  B1: '学部1年',
  B2: '学部2年',
  B3: '学部3年',
  B4: '学部4年',
  M1: '修士1年',
  M2: '修士2年',
  D: '博士課程',
  other: 'その他',
};

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

      // プロフィール画像取得
      const { data: images } = await (supabase as any)
        .from('profile_images')
        .select('*')
        .eq('user_id', profileData.id)
        .order('sort_order', { ascending: true });

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
        .order('created_at', { ascending: false })
        .limit(6);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* プロフィール画像 */}
        <ProfileImageViewer
          images={profileImages}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
        />

        {/* プロフィール情報 */}
        <div className="bg-white -mt-6 relative rounded-t-3xl px-4 pt-6 pb-8">
          {/* 名前とユーザー名 */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.display_name || 'ユーザー'}
            </h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 mb-6">
            {isOwnProfile ? (
              <Link href="/profile/edit" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  プロフィール編集
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? 'outline' : 'default'}
                  className="flex-1"
                >
                  {isFollowing ? 'フォロー中' : 'フォローする'}
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* 統計 */}
          <div className="flex justify-around py-4 border-y mb-6">
            <Link href={`/users/${username}/follows?tab=followers`} className="text-center hover:opacity-70">
              <div className="text-xl font-bold">{followersCount}</div>
              <div className="text-sm text-gray-500">フォロワー</div>
            </Link>
            <Link href={`/users/${username}/follows?tab=following`} className="text-center hover:opacity-70">
              <div className="text-xl font-bold">{followingCount}</div>
              <div className="text-sm text-gray-500">フォロー中</div>
            </Link>
            <div className="text-center">
              <div className="text-xl font-bold">{posts.length}</div>
              <div className="text-sm text-gray-500">投稿</div>
            </div>
          </div>

          {/* 学校情報 */}
          {(profile.university || profile.faculty || profile.grade) && (
            <div className="mb-6 space-y-2">
              {profile.university && (
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  {profile.university}
                  {profile.faculty && ` ${profile.faculty}`}
                </div>
              )}
              {profile.grade && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {GRADE_LABELS[profile.grade] || profile.grade}
                </div>
              )}
            </div>
          )}

          {/* 自己紹介 */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* バッジ */}
          {badges.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-orange-500" />
                もらったバッジ
              </h2>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => {
                  const info = BADGE_INFO[badge.badge_type];
                  if (!info) return null;
                  return (
                    <div
                      key={badge.badge_type}
                      className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm"
                    >
                      <span>{info.emoji}</span>
                      <span>{info.label}</span>
                      <span className="text-orange-400">×{badge.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 投稿一覧 */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-orange-500" />
              投稿
            </h2>
            {posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={{...post, description: post.description ?? undefined, profile: post.profiles ?? undefined, profiles: undefined}} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                まだ投稿がありません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
