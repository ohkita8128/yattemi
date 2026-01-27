'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, User, MapPin, Monitor, Calendar, ChevronDown, ChevronUp, CheckCircle, Clock, Star, MoreHorizontal, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks';
import { useMessages } from '@/hooks/use-messages';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportDialog } from '@/components/common/report-dialog';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(matchId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [postOwner, setPostOwner] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = getClient();

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  // マッチング情報を取得（1回のクエリで全て取得）
  const fetchMatchInfo = async () => {
    const { data } = await (supabase as any)
      .from('matches')
      .select(`
      *,
      application:applications(
        *,
        post:posts(
          id, title, description, type, user_id, category_id, is_online, location, preferred_schedule,
          profile:profiles!user_id(id, username, display_name, avatar_url),
          category:categories(name, slug, icon, color)
        ),
        applicant:profiles!applicant_id(id, username, display_name, avatar_url)
      )
    `)
      .eq('id', matchId)
      .single();

    if (data) {
      setMatchInfo(data);
      setPostOwner(data.application.post.profile);
      setCategory(data.application.post.category);
    }
  };

  useEffect(() => {
    if (matchId) fetchMatchInfo();
  }, [matchId, supabase]);

  // スクロール（メッセージエリア内のみ）
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 既読にする
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 完了報告
  const handleComplete = async () => {
    if (!user || isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .update({
          completed_by: user.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;
      toast.success('完了報告しました！相手の承認をお待ちください');
      fetchMatchInfo();
    } catch (error) {
      console.error('Error:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 完了承認
  const handleConfirm = async () => {
    if (!user || isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .update({
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', matchId);

      if (error) throw error;
      toast.success('完了しました！レビューを書きましょう');
      fetchMatchInfo();
    } catch (error) {
      console.error('Error:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 相手の情報を取得
  const getPartner = () => {
    if (!matchInfo || !user) return null;
    const isPostOwner = matchInfo.application.post.user_id === user.id;
    return isPostOwner ? matchInfo.application.applicant : postOwner;
  };

  // 自分の役割を取得
  const getMyRole = () => {
    if (!matchInfo || !user) return null;
    const isPostOwner = matchInfo.application.post.user_id === user.id;
    const postType = matchInfo.application.post.type;

    if (isPostOwner) {
      return postType === 'support' ? '教える側' : '学ぶ側';
    } else {
      return postType === 'support' ? '学ぶ側' : '教える側';
    }
  };

  // レビューページのパスを取得
  const getReviewPath = () => `/matches/${matchId}/review`;

  const partner = getPartner();
  const myRole = getMyRole();
  const post = matchInfo?.application?.post;

  // 完了ステータスの判定
  const isCompleted = matchInfo?.status === 'completed';
  const hasCompletedBy = !!matchInfo?.completed_by;
  const iCompletedIt = matchInfo?.completed_by === user?.id;
  const partnerCompletedIt = hasCompletedBy && !iCompletedIt;

  if (authLoading || isLoading || !matchInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="container mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href={ROUTES.MATCHES}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {partner && (
            <div className="flex items-center gap-3 flex-1">
              <Link
                href={`/users/${partner.username}`}
                className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-orange-300 transition-all"
              >
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.display_name}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-orange-500" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/users/${partner.username}`} className="font-medium truncate hover:text-orange-500">
                  {partner.display_name}
                </Link>
                <p className="text-xs text-gray-500">
                  あなたは{myRole}
                </p>
              </div>

              {/* メニューボタン */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </button>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border py-1 z-20">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsReportOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Flag className="h-4 w-4" />
                        相手を通報
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 投稿情報カード */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4">
          <button
            onClick={() => setShowPostDetail(!showPostDetail)}
            className="w-full py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${post?.type === 'support'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-cyan-100 text-cyan-700'
                }`}>
                {post?.type === 'support' ? 'サポート' : 'チャレンジ'}
              </span>
              <span className="font-medium text-sm truncate">
                {post?.title}
              </span>
            </div>

            {showPostDetail ? (
              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {showPostDetail && (
            <div className="pb-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {category && (
                  <span
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color
                    }}
                  >
                    {category.name}
                  </span>
                )}

                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {post?.is_online ? (
                    <>
                      <Monitor className="h-3 w-3" />
                      オンライン
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      {post?.location || '対面'}
                    </>
                  )}
                </span>

                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeTime(matchInfo.matched_at)}にマッチ
                </span>
              </div>

              {post?.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
              )}

              {post?.preferred_schedule && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">希望日時:</span> {post.preferred_schedule}
                </div>
              )}

              <Link
                href={`/posts/${post?.id}`}
                className="inline-block text-xs text-orange-500 hover:underline"
              >
                投稿の詳細を見る →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 完了ステータスバー */}
      <div className="border-b bg-white px-4 py-3">
        <div className="container mx-auto max-w-2xl">
          {isCompleted ? (
            // 完了済み → レビューを書くボタン
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">完了しました！</span>
              </div>
              <Link
                href={getReviewPath()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
              >
                <Star className="h-4 w-4" />
                レビューを書く
              </Link>
            </div>
          ) : partnerCompletedIt ? (
            // 相手が完了報告済み → 承認ボタン
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{partner?.display_name}さんが完了報告しました</span>
              </div>
              <button
                onClick={handleConfirm}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                完了を承認
              </button>
            </div>
          ) : iCompletedIt ? (
            // 自分が完了報告済み → 待機中
            <div className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              <span className="font-medium">完了報告済み - {partner?.display_name}さんの承認待ち</span>
            </div>
          ) : (
            // まだ完了報告なし → 完了報告ボタン
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">作業が終わったら完了報告しましょう</p>
              <button
                onClick={handleComplete}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                完了報告
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 bg-white">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-gray-500 mb-2">マッチングおめでとう！</p>
              <p className="text-sm text-gray-400">
                まずは挨拶から始めてみましょう
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${isMe ? 'text-orange-100' : 'text-gray-400'
                        }`}
                    >
                      {formatRelativeTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3">
        <form
          onSubmit={handleSend}
          className="flex gap-2 w-full"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="min-w-0 flex-1 h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:bg-orange-500 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {partner && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          type="user"
          targetId={partner.id}
        />
      )}
    </div>
  );
}