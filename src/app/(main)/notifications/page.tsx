'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=/notifications`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        const { data, error } = await (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchNotifications();
  }, [user, supabase]);

  const markAsRead = async (id: string) => {
    try {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">通知</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600"
          >
            <CheckCheck className="h-4 w-4" />
            すべて既読にする
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">通知はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative bg-white rounded-xl border p-4 transition-colors ${
                !notification.is_read ? 'border-orange-200 bg-orange-50/50' : ''
              }`}
            >
              <div className="flex gap-3">
                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-orange-500" />
                )}

                {/* Content */}
                <div className="flex-1 pl-4">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-orange-500 hover:underline"
                      >
                        詳細を見る
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="既読にする"
                    >
                      <Check className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 rounded-lg hover:bg-red-50"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
