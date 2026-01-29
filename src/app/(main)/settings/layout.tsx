'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Bell,
  Shield,
  AlertTriangle,
  ChevronRight,
  Settings,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_MENU = [
  {
    href: '/profile/edit',
    label: 'プロフィール編集',
    icon: User,
    description: '名前、自己紹介、アバターなど',
  },
  {
    href: '/settings/account',
    label: 'アカウント',
    icon: Settings,
    description: 'メールアドレス、パスワード',
  },
  {
    href: '/settings/notifications',
    label: '通知設定',
    icon: Bell,
    description: '通知のオン/オフ',
  },
  {
    href: '/settings/privacy',
    label: 'プライバシー',
    icon: Shield,
    description: 'プロフィールの公開設定',
  },
  {
    href: '/settings/blocked',  // ← 追加
    label: 'ブロックリスト',
    icon: Ban,
    description: 'ブロック中のユーザー',
  },
  {
    href: '/settings/danger',
    label: 'アカウント管理',
    icon: AlertTriangle,
    description: 'ログアウト、アカウント削除',
    danger: true,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsTop = pathname === '/settings';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* サイドメニュー（PC）/ トップメニュー（設定トップ時） */}
        <nav className={cn(
          "md:w-64 flex-shrink-0",
          !isSettingsTop && "hidden md:block"
        )}>
          <div className="bg-white rounded-xl border overflow-hidden">
            {SETTINGS_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/profile/edit' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 p-4 border-b last:border-b-0 transition-colors",
                    isActive
                      ? "bg-orange-50 border-l-2 border-l-orange-500"
                      : "hover:bg-gray-50",
                    item.danger && !isActive && "text-red-600 hover:bg-red-50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-orange-500" : item.danger ? "text-red-500" : "text-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      isActive && "text-orange-600",
                      item.danger && !isActive && "text-red-600"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 md:hidden" />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* コンテンツエリア */}
        {!isSettingsTop && (
          <main className="flex-1 min-w-0">
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
