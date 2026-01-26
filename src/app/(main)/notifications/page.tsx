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
  HelpCircle,
  MessageCircleQuestion,
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_application':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'application_accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'application_rejected':
        return <FileText className="h-4 w-4 text-gray-400" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'new_like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'new_follower':
        return <UserPlus className="h-4 w-4 text-cyan-500" />;
      case 'new_review':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'new_question':
        return <HelpCircle className="h-4 w-4 text-purple-500" />;
      case 'question_answered':
        return <MessageCircleQuestion className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

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
        return '/applications';
      case 'application_accepted':
      case 'application_rejected':
        return '/applications';
      case 'new_message':
        return data.match_id ? `/matches/${data.match_id}` : '/matches';
      case 'new_review':
        return '/dashboard';
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
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-4 rounded-xl" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            すべて既読
          </button>
        )}
      </div>

      {/* セグメントコントロール風タブ */}
      <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            filter === 'unread'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          未読
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 通知リスト */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getLink(notification) || '#'}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
                className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-orange-50/50' : ''
                }`}
              >
                {/* アイコン */}
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(notification.type)}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm line-clamp-2 ${!notification.is_read ? 'font-medium' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}