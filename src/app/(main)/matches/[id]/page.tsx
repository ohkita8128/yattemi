'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, User, MapPin, Monitor, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks';
import { useMessages } from '@/hooks/use-messages';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getClient();

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  // マッチング情報を取得
  useEffect(() => {
    const fetchMatchInfo = async () => {
      const { data } = await (supabase as any)
        .from('matches')
        .select(`
          *,
          application:applications(
            *,
            post:posts(id, title, description, type, user_id, category_id, is_online, location, preferred_schedule),
            applicant:profiles!applicant_id(id, username, display_name, avatar_url)
          )
        `)
        .eq('id', matchId)
        .single();

      if (data) {
        setMatchInfo(data);
        
        // 投稿者情報を取得
        const { data: owner } = await (supabase as any)
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', data.application.post.user_id)
          .single();
        
        setPostOwner(owner);

        // カテゴリ情報を取得
        const { data: cat } = await (supabase as any)
          .from('categories')
          .select('name, slug, icon, color')
          .eq('id', data.application.post.category_id)
          .single();
        
        setCategory(cat);
      }
    };

    if (matchId) fetchMatchInfo();
  }, [matchId, supabase]);

  // スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const partner = getPartner();
  const myRole = getMyRole();
  const post = matchInfo?.application?.post;

  if (authLoading || isLoading || !matchInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.display_name}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{partner.display_name}</p>
                <p className="text-xs text-gray-500">
                  あなたは{myRole}
                </p>
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
              {/* 投稿タイプバッジ */}
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                post?.type === 'support' 
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-cyan-100 text-cyan-700'
              }`}>
                {post?.type === 'support' ? 'サポートしたい' : 'チャレンジしたい'}
              </span>
              
              {/* タイトル */}
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

          {/* 展開時の詳細 */}
          {showPostDetail && (
            <div className="pb-4 space-y-3">
              {/* カテゴリ・形式・場所 */}
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

              {/* 説明文（短縮） */}
              {post?.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
              )}

              {/* 希望スケジュール */}
              {post?.preferred_schedule && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">希望日時:</span> {post.preferred_schedule}
                </div>
              )}

              {/* 投稿詳細へのリンク */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
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
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMe ? 'text-orange-100' : 'text-gray-400'
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
          className="container mx-auto max-w-2xl flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
