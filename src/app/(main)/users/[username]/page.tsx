'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Calendar, Link as LinkIcon, 
  GraduationCap
} from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { useUserStats, useReviewsFromSenpai, useReviewsFromKouhai } from '@/hooks/use-reviews';
import { useFollowCounts } from '@/hooks/use-follow';
import { useAuth } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/users/follow-button';
import { TeachStats, ChallengeStats, ReviewComment } from '@/components/reviews';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  department: string | null;
  grade: number | null;
  twitter_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'teach' | 'challenge'>('posts');
  const supabase = getClient();

  const { stats } = useUserStats(profile?.id);
  const { counts } = useFollowCounts(profile?.id);
  const { reviews: senpaiReviews } = useReviewsFromSenpai(profile?.id);
  const { reviews: kouhaiReviews } = useReviewsFromKouhai(profile?.id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // プロフィール取得
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          setProfile(null);
          setIsLoading(false);
          return;
        }

        setProfile(profileData);

        // 投稿取得
        const { data: postsData } = await (supabase as any)
          .from('posts')
          .select(`
            *,
            category:categories(name, slug, color)
          `)
          .eq('user_id', profileData.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        setPosts(postsData || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username, supabase]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-32 w-full rounded-xl mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* アバター */}
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-24 w-24 object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-orange-500" />
              )}
            </div>
          </div>

          {/* 情報 */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <p className="text-gray-500">@{profile.username}</p>
              </div>
              
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  編集
                </Link>
              ) : (
                <FollowButton userId={profile.id} />
              )}
            </div>

            {profile.bio && (
              <p className="mt-3 text-gray-700">{profile.bio}</p>
            )}

            {/* メタ情報 */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {profile.university && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {profile.university}
                  {profile.department && ` ${profile.department}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatRelativeTime(profile.created_at)}に参加
              </span>
            </div>

            {/* フォロー数 */}
            <div className="flex gap-4 mt-4">
              <button className="text-sm hover:underline">
                <span className="font-bold">{counts.following_count}</span>
                <span className="text-gray-500 ml-1">フォロー中</span>
              </button>
              <button className="text-sm hover:underline">
                <span className="font-bold">{counts.followers_count}</span>
                <span className="text-gray-500 ml-1">フォロワー</span>
              </button>
            </div>

            {/* SNSリンク */}
            {(profile.twitter_url || profile.instagram_url || profile.website_url) && (
              <div className="flex gap-3 mt-4">
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    𝕏
                  </a>
                )}
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-500"
                  >
                    📷
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ティーチ・チャレンジ実績 */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <TeachStats stats={stats} />
          <ChallengeStats stats={stats} />
        </div>
      </div>

      {/* コメント */}
      {(senpaiReviews.length > 0 || kouhaiReviews.length > 0) && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
          <h2 className="font-bold mb-4">もらったコメント</h2>
          <div className="space-y-3">
            {senpaiReviews.slice(0, 3).map((review) => (
              review.comment && (
                <ReviewComment
                  key={review.id}
                  comment={review.comment}
                  reviewerName={review.reviewer?.display_name || ''}
                  reviewerRole="senpai"
                />
              )
            ))}
            {kouhaiReviews.slice(0, 3).map((review) => (
              review.comment && (
                <ReviewComment
                  key={review.id}
                  comment={review.comment}
                  reviewerName={review.reviewer?.display_name || ''}
                  reviewerRole="kouhai"
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'posts'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          投稿 ({posts.length})
        </button>
      </div>

      {/* 投稿一覧 */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              まだ投稿がありません
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.type === 'teach' 
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {post.type === 'teach' ? '教えたい' : '学びたい'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    {post.category && (
                      <span 
                        className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ 
                          backgroundColor: `${post.category.color}15`,
                          color: post.category.color 
                        }}
                      >
                        {post.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
