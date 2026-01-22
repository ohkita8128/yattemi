'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface MatchWithDetails {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  matched_at: string;
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

export default function MatchesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=/matches`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchMatches = async () => {
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

        // 投稿者情報を取得して、自分が関わっているマッチングのみフィルタ
        const matchesWithOwners = await Promise.all(
          (data || []).map(async (match: MatchWithDetails) => {
            const { data: owner } = await (supabase as any)
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', match.application.post.user_id)
              .single();
            
            return { ...match, post_owner: owner };
          })
        );

        const myMatches = matchesWithOwners.filter((match) => {
          const isPostOwner = match.application.post.user_id === user.id;
          const isApplicant = match.application.applicant.id === user.id;
          return isPostOwner || isApplicant;
        });

        setMatches(myMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchMatches();
  }, [user, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">マッチング</h1>
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
      <h1 className="text-2xl font-bold mb-6">マッチング</h1>

      {matches.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">まだマッチングがありません</p>
          <Link
            href={ROUTES.EXPLORE}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            投稿を探す
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const isPostOwner = match.application.post.user_id === user?.id;
            const partner = isPostOwner 
              ? match.application.applicant 
              : match.post_owner;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="block bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Partner Avatar */}
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                    {partner?.avatar_url ? (
                      <img
                        src={partner.avatar_url}
                        alt={partner.display_name}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-orange-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {match.application.post.title}
                    </p>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      {isPostOwner ? (
                        <>
                          <span className="font-medium text-gray-700">
                            {partner?.display_name}
                          </span>
                          さんとマッチング
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">
                            {partner?.display_name}
                          </span>
                          さんの投稿に応募承認
                        </>
                      )}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(match.matched_at)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        match.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : match.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {match.status === 'active' ? '進行中' : 
                         match.status === 'completed' ? '完了' : 'キャンセル'}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
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
