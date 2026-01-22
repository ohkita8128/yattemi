'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, MessageCircle, Calendar, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface ChallengeWithDetails {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  matched_at: string;
  completed_by: string | null;
  confirmed_by: string | null;
  application: {
    id: string;
    message: string | null;
    post: {
      id: string;
      title: string;
      type: 'teach' | 'learn';
      user_id: string;
    };
    applicant: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  post_owner?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function ChallengesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const supabase = getClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=/challenges`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await (supabase as any)
          .from('matches')
          .select(`
            *,
            application:applications(
              id,
              message,
              applicant:profiles!applicant_id(id, username, display_name, avatar_url),
              post:posts(id, title, type, user_id)
            )
          `)
          .order('matched_at', { ascending: false });

        if (error) throw error;

        const challengesWithOwners = await Promise.all(
          (data || []).map(async (challenge: ChallengeWithDetails) => {
            const { data: owner } = await (supabase as any)
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', challenge.application.post.user_id)
              .single();
            
            return { ...challenge, post_owner: owner };
          })
        );

        // 自分が後輩（学ぶ側）のものだけフィルタ
        const myChallenges = challengesWithOwners.filter((challenge) => {
          const postType = challenge.application.post.type;
          const isPostOwner = challenge.application.post.user_id === user.id;
          const isApplicant = challenge.application.applicant.id === user.id;
          
          // 教えたい投稿の応募者 → 後輩
          // 学びたい投稿の投稿者 → 後輩
          if (postType === 'teach' && isApplicant) return true;
          if (postType === 'learn' && isPostOwner) return true;
          return false;
        });

        setChallenges(myChallenges);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchChallenges();
  }, [user, supabase]);

  const filteredChallenges = challenges.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status === 'active';
    if (filter === 'completed') return c.status === 'completed';
    return true;
  });

  const getStatusBadge = (challenge: ChallengeWithDetails) => {
    if (challenge.status === 'completed') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
          <CheckCircle className="h-3 w-3" />
          完了
        </span>
      );
    }
    if (challenge.status === 'cancelled') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
          <XCircle className="h-3 w-3" />
          キャンセル
        </span>
      );
    }
    if (challenge.completed_by) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">
          <Clock className="h-3 w-3" />
          確認待ち
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs">
        <Rocket className="h-3 w-3" />
        進行中
      </span>
    );
  };

  // 先輩の情報を取得
  const getSenpai = (challenge: ChallengeWithDetails) => {
    const postType = challenge.application.post.type;
    // 教えたい投稿 → 投稿者が先輩
    // 学びたい投稿 → 応募者が先輩
    if (postType === 'teach') {
      return challenge.post_owner;
    } else {
      return challenge.application.applicant;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">チャレンジ</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Rocket className="h-8 w-8 text-cyan-500" />
        <h1 className="text-2xl font-bold">チャレンジ</h1>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'active' ? '進行中' : '完了'}
          </button>
        ))}
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="text-center py-16">
          <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'まだチャレンジがありません' 
              : filter === 'active'
              ? '進行中のチャレンジはありません'
              : '完了したチャレンジはありません'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            「教えたい」投稿に応募して新しいスキルを学ぼう！
          </p>
          <Link
            href={ROUTES.EXPLORE}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600"
          >
            投稿を探す
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => {
            const senpai = getSenpai(challenge);

            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="block bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* 先輩のアバター */}
                  <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {senpai?.avatar_url ? (
                      <img
                        src={senpai.avatar_url}
                        alt={senpai.display_name}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-cyan-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">
                        {challenge.application.post.title}
                      </p>
                      {getStatusBadge(challenge)}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium text-gray-700">
                        {senpai?.display_name}
                      </span>
                      さん（先輩）から学ぶ
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(challenge.matched_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-2 rounded-lg bg-cyan-50 text-cyan-500 flex-shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
