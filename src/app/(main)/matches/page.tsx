'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, Filter, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import Image from 'next/image'

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
        // ✅ 1回のRPCで全部取得
        const { data, error } = await (supabase as any).rpc('get_matches_with_details', {
          p_user_id: user.id
        });

        if (error) throw error;

        // データを整形
        const formattedMatches = (data || []).map((m: any) => ({
          id: m.id,
          status: m.status,
          matched_at: m.matched_at,
          application: {
            id: m.application_id,
            message: m.application_message,
            post: {
              id: m.post_id,
              title: m.post_title,
              type: m.post_type,
              user_id: m.post_user_id,
            },
            applicant: {
              id: m.applicant_id,
              username: m.applicant_username,
              display_name: m.applicant_display_name,
              avatar_url: m.applicant_avatar_url,
            },
          },
          post_owner: {
            id: m.owner_id,
            username: m.owner_username,
            display_name: m.owner_display_name,
            avatar_url: m.owner_avatar_url,
          },
          last_message: m.last_message_content ? {
            content: m.last_message_content,
            created_at: m.last_message_created_at,
            sender_id: m.last_message_sender_id,
          } : null,
          unread_count: m.unread_count || 0,
        }));

        setMatches(formattedMatches);
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'active'
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'completed'
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
        <div className="divide-y">
          {filteredMatches.map((match) => {
            const isPostOwner = match.application.post.user_id === user?.id;
            const partner = isPostOwner
              ? match.application.applicant
              : match.post_owner;
            const hasUnread = (match.unread_count || 0) > 0;
            const lastMessage = match.last_message;
            const postType = match.application.post.type;

            return (
              <div
                key={match.id}
                className={`flex items-start py-3 hover:bg-gray-50 transition-colors ${hasUnread ? 'bg-orange-50/50' : ''
                  }`}
              >
                {/* Avatar */}
                <Link
                  href={`/users/${partner?.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex-shrink-0 mt-0.5"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-300 transition-all">
                    {partner?.avatar_url ? (
                      <Image
                        src={partner.avatar_url!}
                        alt={partner.display_name || 'ユーザー'}
                        width={96}
                        height={96}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-orange-500" />
                    )}
                  </div>
                </Link>

                {/* Content */}
                <Link href={`/matches/${match.id}`} className="flex-1 ml-3 min-w-0">
                  {/* 1行目: 名前 + バッジ + 時間 */}
                  <div className="flex items-center gap-1.5">
                    <p className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {partner?.display_name}
                    </p>
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded ${postType === 'support'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-cyan-100 text-cyan-600'
                      }`}>
                      {postType === 'support' ? 'サポート' : 'チャレンジ'}
                    </span>
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded ${match.status === 'active'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                      }`}>
                      {match.status === 'active' ? '進行中' : '完了'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                      {formatRelativeTime(lastMessage?.created_at || match.matched_at)}
                    </span>
                  </div>

                  {/* 2行目: タイトル */}
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {match.application.post.title}
                  </p>

                  {/* 3行目: 最新メッセージ + 未読バッジ */}
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {lastMessage ? (
                        <>
                          {lastMessage.sender_id === user?.id && <span className="text-gray-400">あなた: </span>}
                          {lastMessage.content}
                        </>
                      ) : (
                        'メッセージを始めましょう'
                      )}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {match.unread_count}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
