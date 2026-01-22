'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/posts/post-card';
import { 
  GraduationCap, 
  Users, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  MessageCircle,
  Star,
  Loader2
} from 'lucide-react';

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
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    university: string | null;
  } | null;
  categories: {
    id: number;
    name: string;
    slug: string;
  } | null;
  _count?: {
    likes: number;
  };
};

export default function HomePage() {
  const supabaseRef = useRef(getClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // おすすめ投稿を取得（最新の投稿）
        const { data: recommended } = await (supabase as any)
          .from('posts')
          .select(`
            *,
            profiles (id, username, display_name, avatar_url, university),
            categories (id, name, slug)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (recommended) {
          setRecommendedPosts(recommended);
        }

        // フォロー中のユーザーの投稿を取得
        const { data: following } = await (supabase as any)
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followingIds = following.map((f: any) => f.following_id);
          const { data: followPosts } = await (supabase as any)
            .from('posts')
            .select(`
              *,
              profiles (id, username, display_name, avatar_url, university),
              categories (id, name, slug)
            `)
            .in('user_id', followingIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6);

          if (followPosts) {
            setFollowingPosts(followPosts);
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ログイン済みユーザー向けホーム
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ウェルカムセクション */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 mb-8 text-white">
            <h1 className="text-2xl font-bold mb-2">おかえりなさい！ 👋</h1>
            <p className="opacity-90">今日も新しいスキルを見つけましょう</p>
            <div className="flex gap-3 mt-4">
              <Link href="/posts/new">
                <Button variant="secondary" size="sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  投稿する
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  探す
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* おすすめ投稿 */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">🔥 新着の投稿</h2>
              <Link href="/explore" className="text-orange-500 hover:underline text-sm flex items-center">
                もっと見る
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            {recommendedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border">
                <p className="text-gray-500">まだ投稿がありません</p>
                <Link href="/posts/new">
                  <Button className="mt-4">最初の投稿を作成</Button>
                </Link>
              </div>
            )}
          </section>

          {/* フォロー中の投稿 */}
          {followingPosts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">👥 フォロー中</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followingPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // 未ログインユーザー向けLP
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            大学生のための
            <br />
            <span className="text-orange-500">スキルシェア</span>プラットフォーム
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            教えたいスキルがある人と、学びたい人をマッチング。
            <br />
            同じ大学生同士だから、気軽に始められる。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                無料で始める
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                投稿を見てみる
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            YatteMi! の特徴
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GraduationCap className="h-8 w-8" />}
              title="大学生限定"
              description="同じ大学生同士だから安心。年齢が近いから話しやすい！"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="双方向マッチング"
              description="教える側も学ぶ側も体験できる。今日は先輩、明日は後輩。"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="多彩なスキル"
              description="プログラミング、音楽、語学、スポーツ...なんでもシェア！"
            />
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            使い方はかんたん
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="登録する"
              description="メールアドレスで簡単登録。プロフィールを設定しよう。"
            />
            <StepCard
              number={2}
              title="投稿 or 検索"
              description="教えたいことを投稿するか、学びたいスキルを探そう。"
            />
            <StepCard
              number={3}
              title="マッチング"
              description="気になる人に応募して、チャットでやり取りを始めよう！"
            />
          </div>
        </div>
      </section>

      {/* 統計セクション */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <StatCard icon={<BookOpen />} value="17" label="カテゴリ" />
            <StatCard icon={<MessageCircle />} value="∞" label="可能性" />
            <StatCard icon={<Star />} value="5.0" label="満足度" />
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            今日から始めよう
          </h2>
          <p className="text-lg opacity-90 mb-8">
            あなたのスキルが誰かの助けになる。
            <br />
            誰かのスキルがあなたの成長になる。
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              無料で登録する
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xl font-bold text-white mb-2">YatteMi!</p>
          <p className="text-sm">© 2026 YatteMi! All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
        {number}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="text-orange-500 flex justify-center mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}
