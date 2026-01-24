'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Heart,
  UserPlus,
  Award,
  FileText,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const supabaseRef = useRef(getClient());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const supabase = supabaseRef.current;

      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
      setIsLoading(false);
    };

    fetchNotifications();

    // リアルタイム購読
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    const supabase = supabaseRef.current;

    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = supabaseRef.current;

    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    const supabase = supabaseRef.current;

    await (supabase as any).from('notifications').delete().eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_application':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'application_accepted':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'application_rejected':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'new_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'new_follower':
        return <UserPlus className="h-5 w-5 text-cyan-500" />;
      case 'new_review':
        return <Award className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // 通知タイプごとにリンクを生成
  const getLink = (notification: Notification) => {
    const data = notification.data as Record<string, string> | null;
    if (!data) return null;
    
    switch (notification.type) {
      case 'new_like':
      case 'new_question':
      case 'question_answered':
        return data.post_id ? `/posts/${data.post_id}` : null;
      case 'new_follower':
      case 'new_follow':
        return data.username ? `/users/${data.username}` : null;
      case 'new_application':
        return '/dashboard?tab=received';
      case 'application_accepted':
      case 'application_rejected':
        return '/dashboard?tab=sent';
      case 'new_message':
        return data.match_id ? `/messages/${data.match_id}` : '/messages';
      case 'new_review':
        return '/dashboard?tab=reviews';
      default:
        return null;
    }
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">通知</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount}件の未読</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
          >
            <CheckCheck className="h-4 w-4" />
            すべて既読にする
          </button>
        )}
      </div>

      {/* フィルタータブ */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          未読
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 通知リスト */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-bold mb-2">
            {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
          </h2>
          <p className="text-gray-500">
            新しい通知が届くとここに表示されます
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              <Link
                href={getLink(notification) || '#'}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
                className="flex items-start gap-4"
              >
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </Link>

              {/* アクションボタン */}
              <div className="absolute top-2 right-2 flex gap-1 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    title="既読にする"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
