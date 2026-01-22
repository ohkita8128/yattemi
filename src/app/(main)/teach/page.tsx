'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, MessageCircle, Calendar, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface TeachWithDetails {
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

export default function TeachPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [teaches, setTeaches] = useState<TeachWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const supabase = getClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=/teach`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchTeaches = async () => {
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

        const teachesWithOwners = await Promise.all(
          (data || []).map(async (teach: TeachWithDetails) => {
            const { data: owner } = await (supabase as any)
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', teach.application.post.user_id)
              .single();
            
            return { ...teach, post_owner: owner };
          })
        );

        // 自分が先輩（教える側）のものだけフィルタ
        const myTeaches = teachesWithOwners.filter((teach) => {
          const postType = teach.application.post.type;
          const isPostOwner = teach.application.post.user_id === user.id;
          const isApplicant = teach.application.applicant.id === user.id;
          
          // 教えたい投稿の投稿者 → 先輩
          // 学びたい投稿の応募者 → 先輩
          if (postType === 'teach' && isPostOwner) return true;
          if (postType === 'learn' && isApplicant) return true;
          return false;
        });

        setTeaches(myTeaches);
      } catch (error) {
        console.error('Error fetching teaches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchTeaches();
  }, [user, supabase]);

  const filteredTeaches = teaches.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status === 'active';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const getStatusBadge = (teach: TeachWithDetails) => {
    if (teach.status === 'completed') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
          <CheckCircle className="h-3 w-3" />
          完了
        </span>
      );
    }
    if (teach.status === 'cancelled') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
          <XCircle className="h-3 w-3" />
          キャンセル
        </span>
      );
    }
    if (teach.completed_by) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">
          <Clock className="h-3 w-3" />
          確認待ち
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
        <GraduationCap className="h-3 w-3" />
        進行中
      </span>
    );
  };

  // 後輩の情報を取得
  const getKouhai = (teach: TeachWithDetails) => {
    const postType = teach.application.post.type;
    // 教えたい投稿 → 応募者が後輩
    // 学びたい投稿 → 投稿者が後輩
    if (postType === 'teach') {
      return teach.application.applicant;
    } else {
      return teach.post_owner;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">ティーチ</h1>
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
        <GraduationCap className="h-8 w-8 text-purple-500" />
        <h1 className="text-2xl font-bold">ティーチ</h1>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'active' ? '進行中' : '完了'}
          </button>
        ))}
      </div>

      {filteredTeaches.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'まだティーチがありません' 
              : filter === 'active'
              ? '進行中のティーチはありません'
              : '完了したティーチはありません'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            「学びたい」投稿に応募して先輩になろう！
          </p>
          <Link
            href={ROUTES.EXPLORE}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600"
          >
            投稿を探す
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeaches.map((teach) => {
            const kouhai = getKouhai(teach);

            return (
              <Link
                key={teach.id}
                href={`/teach/${teach.id}`}
                className="block bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* 後輩のアバター */}
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {kouhai?.avatar_url ? (
                      <img
                        src={kouhai.avatar_url}
                        alt={kouhai.display_name}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-purple-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">
                        {teach.application.post.title}
                      </p>
                      {getStatusBadge(teach)}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium text-gray-700">
                        {kouhai?.display_name}
                      </span>
                      さん（後輩）に教える
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(teach.matched_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-500 flex-shrink-0">
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
