'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, Filter, CheckCircle, Clock} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

type FilterType = 'all' | 'active' | 'completed';

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
      type: 'support' | 'challenge';
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
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count?: number;
}

export default function MatchesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
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

        // 投稿者情報 + 最新メッセージ + 未読数を取得
        const matchesWithDetails = await Promise.all(
          (data || []).map(async (match: MatchWithDetails) => {
            // 投稿者情報
            const { data: owner } = await (supabase as any)
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', match.application.post.user_id)
              .single();

            // 最新メッセージ
            const { data: lastMsg } = await (supabase as any)
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('match_id', match.id)
              .order('created_at', { ascending: false })
              .limit(1).maybeSingle();

            // 未読数
            const { count: unreadCount } = await (supabase as any)
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('match_id', match.id)
              .eq('is_read', false)
              .neq('sender_id', user.id);

            return { 
              ...match, 
              post_owner: owner,
              last_message: lastMsg || null,
              unread_count: unreadCount || 0
            };
          })
        );

        // 自分が関わっているマッチングのみフィルタ
        const myMatches = matchesWithDetails.filter((match) => {
          const isPostOwner = match.application.post.user_id === user.id;
          const isApplicant = match.application.applicant.id === user.id;
          return isPostOwner || isApplicant;
        });

        // 最新メッセージ順でソート
        myMatches.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.matched_at;
          const bTime = b.last_message?.created_at || b.matched_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
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

  // フィルター適用
  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    if (filter === 'active') return match.status === 'active';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">メッセージ</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">メッセージ</h1>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="h-4 w-4" />
          すべて
          <span className="ml-1 text-xs opacity-70">({matches.length})</span>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          進行中
          <span className="ml-1 text-xs opacity-70">
            ({matches.filter(m => m.status === 'active').length})
          </span>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          完了
          <span className="ml-1 text-xs opacity-70">
            ({matches.filter(m => m.status === 'completed').length})
          </span>
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'まだメッセージがありません' 
              : filter === 'active'
              ? '進行中のやり取りがありません'
              : '完了したやり取りがありません'}
          </p>
          {filter === 'all' && (
            <Link
              href={ROUTES.EXPLORE}
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
            >
              投稿を探す
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMatches.map((match) => {
            const isPostOwner = match.application.post.user_id === user?.id;
            const partner = isPostOwner
              ? match.application.applicant
              : match.post_owner;
            const hasUnread = (match.unread_count || 0) > 0;
            const lastMessage = match.last_message;

            return (
              <div
                key={match.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  hasUnread ? 'border-orange-200 bg-orange-50/30' : ''
                }`}
              >
                <div className="flex items-center p-4">
                  {/* Partner Avatar - クリックでプロフィールへ */}
                  <Link
                    href={`/users/${partner?.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex-shrink-0"
                  >
                    <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-300 transition-all">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partner.display_name}
                          className="h-14 w-14 object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-orange-500" />
                      )}
                    </div>
                    {/* オンラインステータス風の装飾 */}
                    {match.status === 'active' && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </Link>

                  {/* Content - クリックでチャットへ */}
                  <Link
                    href={`/matches/${match.id}`}
                    className="flex-1 ml-4 min-w-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">
                        {partner?.display_name}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatRelativeTime(lastMessage?.created_at || match.matched_at)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {match.application.post.title}
                    </p>

                    {/* 最新メッセージプレビュー */}
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {lastMessage ? (
                          <>
                            {lastMessage.sender_id === user?.id && (
                              <span className="text-gray-400">あなた: </span>
                            )}
                            {lastMessage.content}
                          </>
                        ) : (
                          'メッセージを始めましょう'
                        )}
                      </p>

                      {/* 未読バッジ */}
                      {hasUnread && (
                        <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {match.unread_count}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                {/* ステータスバー */}
                <div className="px-4 pb-3 pt-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      match.application.post.type === 'support'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {match.application.post.type === 'support' ? 'サポート' : 'チャレンジ'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
