'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, Plus, LogOut, User, Settings, FileText, Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks';
import { useNotificationStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ホーム', href: ROUTES.HOME },
  { label: '探す', href: ROUTES.EXPLORE },
];

export function Header() {
  const pathname = usePathname();
  const { profile, isAuthenticated, signOut } = useAuth();
  const { unreadCount } = useNotificationStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 text-xl font-bold"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <span className="text-2xl">🎯</span>
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            YatteMi!
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname === item.href
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href={ROUTES.NOTIFICATIONS}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href={ROUTES.POST_NEW}
                className="inline-flex items-center h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4 mr-1" />
                投稿する
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium">
                      {profile?.display_name?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border z-20">
                      <div className="p-3 border-b">
                        <p className="font-medium">{profile?.display_name}</p>
                        <p className="text-sm text-gray-500">@{profile?.username}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href={ROUTES.PROFILE}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                        >
                          <User className="h-4 w-4" />
                          プロフィール
                        </Link>
                        <Link
                          href={ROUTES.APPLICATIONS}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          応募管理
                        </Link>
                        <Link
                          href={ROUTES.MATCHES}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                        >
                          <Heart className="h-4 w-4" />
                          マッチング
                        </Link>
                        <Link
                          href={ROUTES.PROFILE_EDIT}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                        >
                          <Settings className="h-4 w-4" />
                          設定
                        </Link>
                      </div>
                      <div className="p-2 border-t">
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          ログアウト
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.LOGIN}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ログイン
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="inline-flex items-center h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:shadow-md transition-all"
              >
                新規登録
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
        >
          {isMobileNavOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="border-t pt-4 mt-4 space-y-2">
                  <Link
                    href={ROUTES.POST_NEW}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500 text-white font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    投稿する
                  </Link>
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                    プロフィール
                  </Link>
                </div>
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileNavOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Link
                  href={ROUTES.LOGIN}
                  onClick={() => setIsMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-xl text-center font-medium hover:bg-gray-100"
                >
                  ログイン
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  onClick={() => setIsMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-xl text-center font-medium bg-orange-500 text-white"
                >
                  新規登録
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}