'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, PartyPopper } from 'lucide-react';
import { useAuth, useReviews, ReviewerRole } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewForm } from '@/components/reviews';

export default function MatchReviewPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasReviewed, refetch: refetchReviews } = useReviews(matchId);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [postOwner, setPostOwner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchMatchInfo = async () => {
      const { data } = await (supabase as any)
        .from('matches')
        .select(`
          *,
          application:applications(
            *,
            post:posts(id, title, type, user_id),
            applicant:profiles!applicant_id(id, username, display_name, avatar_url)
          )
        `)
        .eq('id', matchId)
        .single();

      if (data) {
        setMatchInfo(data);

        const { data: owner } = await (supabase as any)
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', data.application.post.user_id)
          .single();

        setPostOwner(owner);
      }
      setIsLoading(false);
    };

    if (matchId) fetchMatchInfo();
  }, [matchId, supabase]);

  // 相手の情報を取得
  const getPartner = () => {
    if (!matchInfo || !user) return null;
    const isPostOwner = matchInfo.application.post.user_id === user.id;
    return isPostOwner ? matchInfo.application.applicant : postOwner;
  };

  // 自分の役割を取得（senpai = 教える側, kouhai = 学ぶ側）
  const getMyRole = (): ReviewerRole => {
    if (!matchInfo || !user) return 'kouhai';

    const postType = matchInfo.application.post.type;
    const isPostOwner = matchInfo.application.post.user_id === user.id;

    // サポート投稿の投稿者 → 教える側(senpai)
    // サポート投稿の応募者 → 学ぶ側(kouhai)
    // チャレンジ投稿の投稿者 → 学ぶ側(kouhai)
    // チャレンジ投稿の応募者 → 教える側(senpai)
    if (postType === 'support') {
      return isPostOwner ? 'senpai' : 'kouhai';
    } else {
      return isPostOwner ? 'kouhai' : 'senpai';
    }
  };

  const partner = getPartner();
  const myRole = getMyRole();

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    refetchReviews();
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 既にレビュー済みの場合
  if (hasReviewed || !showReviewForm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <PartyPopper className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {myRole === 'senpai' ? 'サポート' : 'チャレンジ'}完了！
          </h1>
          <p className="text-gray-500 mb-8">
            お疲れさまでした！<br />
            また新しい{myRole === 'senpai' ? 'サポート' : 'チャレンジ'}を探してみよう
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={ROUTES.EXPLORE}
              className="h-12 px-6 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 inline-flex items-center justify-center"
            >
              投稿を探す
            </Link>
            <Link
              href={ROUTES.MATCHES}
              className="h-12 px-6 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 inline-flex items-center justify-center"
            >
              メッセージ一覧へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/matches/${matchId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <h1 className="text-xl font-bold">
            {myRole === 'senpai' ? 'サポート' : 'チャレンジ'}完了！
          </h1>
        </div>
        <p className="text-gray-500">
          {matchInfo?.application.post.title}
        </p>
      </div>

      {/* Review Form */}
      {partner && (
        <ReviewForm
          matchId={matchId}
          revieweeId={partner.id}
          revieweeName={partner.display_name}
          revieweeAvatar={partner.avatar_url}
          myRole={myRole}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}