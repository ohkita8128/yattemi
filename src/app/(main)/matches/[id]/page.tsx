'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, User, MapPin, Monitor, Calendar, ChevronDown, ChevronUp, CheckCircle, Clock, Star, MoreHorizontal, Flag, MessageCircle } from 'lucide-react';
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
  const [showStatusBar, setShowStatusBar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = getClient();

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  // マッチング情報を取得
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

  // スクロール（メッセージエリア内のみ）- 初回ロード時も最新へ
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // 少し遅延させてDOMレンダリング完了後にスクロール
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, matchInfo]);

  // 既読にする
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  // スクロール監視
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStatusBar(scrollTop < 50);
  };

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

  // テンプレメッセージを送信
  const handleSendTemplate = async () => {
    if (isSending) return;

    const templateMessage = 'はじめまして！よろしくお願いします 😊';

    setIsSending(true);
    try {
      await sendMessage(templateMessage);
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

  const getReviewPath = () => `/matches/${matchId}/review`;

  const partner = getPartner();
  const myRole = getMyRole();
  const post = matchInfo?.application?.post;

  const isCompleted = matchInfo?.status === 'completed';
  const hasCompletedBy = !!matchInfo?.completed_by;
  const iCompletedIt = matchInfo?.completed_by === user?.id;
  const partnerCompletedIt = hasCompletedBy && !iCompletedIt;

  // 完了ボタンのレンダリング
  const renderCompletionButton = (fullWidth = false) => {
    const baseClass = fullWidth
      ? "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium transition-colors"
      : "flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-colors";

    if (isCompleted) {
      return (
        <Link
          href={getReviewPath()}
          className={`${baseClass} bg-orange-500 text-white hover:bg-orange-600`}
        >
          <Star className="h-4 w-4" />
          レビューを書く
        </Link>
      );
    }
    if (partnerCompletedIt) {
      return (
        <button
          onClick={handleConfirm}
          disabled={isUpdating}
          className={`${baseClass} bg-green-500 text-white hover:bg-green-600 disabled:opacity-50`}
        >
          <CheckCircle className="h-4 w-4" />
          完了を承認する
        </button>
      );
    }
    if (iCompletedIt) {
      return (
        <div className={`${baseClass} bg-yellow-50 text-yellow-700`}>
          <Clock className="h-4 w-4" />
          相手の承認待ち
        </div>
      );
    }
    return (
      <button
        onClick={handleComplete}
        disabled={isUpdating}
        className={`${baseClass} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50`}
      >
        <CheckCircle className="h-4 w-4" />
        完了報告
      </button>
    );
  };

  if (authLoading || isLoading || !matchInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - 固定 */}
      <div className="flex-none border-b bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={ROUTES.MATCHES}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {partner && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                <Link href={`/users/${partner.username}`} className="font-medium truncate block hover:text-orange-500">
                  {partner.display_name}
                </Link>
                <p className="text-xs text-gray-500">
                  あなたは{myRole}
                </p>
              </div>

              {/* メニューボタン - 通報のみ */}
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
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border py-1 z-20">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsReportOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
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

      {/* 投稿情報カード - 固定 */}
      <div className="flex-none border-b bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => setShowPostDetail(!showPostDetail)}
            className="w-full py-2.5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
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
              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            )}
          </button>

          {showPostDetail && (
            <div className="pb-3 space-y-2">
              <div className="flex flex-wrap gap-1.5 text-xs">
                {category && (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color
                    }}
                  >
                    {category.name}
                  </span>
                )}

                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
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

                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeTime(matchInfo.matched_at)}にマッチ
                </span>
              </div>

              {post?.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
              )}

              <Link
                href={`/posts/${post?.id}`}
                className="inline-block text-xs text-orange-500 hover:underline"
              >
                投稿の詳細を見る →
              </Link>

              {/* 完了報告ボタン - 投稿詳細内 */}
              <div className="pt-2 border-t">
                {renderCompletionButton(true)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 完了ステータスバー - メッセージがある時＆初回表示時のみ */}
      {showStatusBar && messages.length > 0 && (
        <div className="flex-none border-b bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto">
            {isCompleted ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">完了しました！</span>
                </div>
                {renderCompletionButton()}
              </div>
            ) : partnerCompletedIt ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium text-sm">{partner?.display_name}さんが完了報告</span>
                </div>
                {renderCompletionButton()}
              </div>
            ) : iCompletedIt ? (
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium text-sm">完了報告済み - 相手の承認待ち</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">作業が終わったら完了報告しましょう</p>
                {renderCompletionButton()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages - スクロール領域 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto overscroll-none bg-white"
      >
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            // ガイダンス表示
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">マッチングおめでとう！</h3>
                <p className="text-sm text-gray-500">
                  {partner?.display_name}さんとつながりました
                </p>
              </div>

              {/* 流れの説明 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  こんな流れで進めましょう
                </h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-medium text-orange-500">1.</span>
                    まずは挨拶！自己紹介してみよう
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-orange-500">2.</span>
                    都合の良い日時・場所を相談
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-orange-500">3.</span>
                    連絡先を交換してもOK
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-orange-500">4.</span>
                    実際に会って（またはオンラインで）活動！
                  </li>
                </ol>
              </div>

              {/* ヒント */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  ヒント
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  仲良くなったら連絡先交換もOK！
                  <br />
                  実際のやり取りはLINE、Discord、Zoomなど
                  <br />
                  目的に合わせてお互いが使いやすいツールで！
                </p>
              </div>

              {/* 注意書き */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  安全にご利用ください
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 初めて会う時は公共の場所で</li>
                  <li>• 個人情報は信頼できる相手にのみ</li>
                  <li>• 金銭のやり取りはトラブルの元</li>
                  <li>• 不審に感じたら通報してください</li>
                </ul>
              </div>

              {/* テンプレートボタン */}
              <button
                onClick={handleSendTemplate}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                「はじめまして！よろしくお願いします 😊」を送る
              </button>
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
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
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

      {/* Input - 固定 */}
      <div className="flex-none border-t bg-white px-4 py-2">
        <form
          onSubmit={handleSend}
          className="flex gap-2 max-w-2xl mx-auto"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="min-w-0 flex-1 h-11 px-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-11 w-11 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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