'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, LucideMail, User } from 'lucide-react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ホーム', href: '/', icon: Home },
  { label: '探す', href: '/explore', icon: Search },
  { label: '投稿', href: '/posts/new', icon: Plus, highlight: true },
  { label: 'メッセージ', href: '/matches', icon: LucideMail },
  { label: 'マイページ', href: '/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, profile } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // 未読メッセージ数を取得
  useEffect(() => {
    if (!profile?.id) return;

    const fetchUnreadMessages = async () => {
      const supabase = getClient();
      
      const { count } = await (supabase as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', profile.id)
        .eq('is_read', false);
      
      setUnreadMessages(count || 0);
    };

    fetchUnreadMessages();
    
    // 30秒ごとに更新
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          // マイページは動的リンク
          const href = item.href === '/profile' && profile?.username 
            ? `/users/${profile.username}` 
            : item.href;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </Link>
            );
          }

          // メッセージアイコンの場合
          if (item.href === '/matches') {
            return (
              <Link
                key={item.href}
                href={href}
                className="flex flex-col items-center justify-center py-2 px-3 relative"
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 mb-1',
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    )}
                  />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px]',
                    isActive ? 'text-orange-500 font-medium' : 'text-gray-400'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              className="flex flex-col items-center justify-center py-2 px-3"
            >
              <Icon
                className={cn(
                  'h-5 w-5 mb-1',
                  isActive ? 'text-orange-500' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'text-[10px]',
                  isActive ? 'text-orange-500 font-medium' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}