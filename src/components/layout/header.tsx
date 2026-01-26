'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Bell,
  Plus,
  Search,
  LogOut,
  User,
  Settings,
  FileText,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useUIStore, useNotificationStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ホーム', href: ROUTES.HOME },
  { label: '探す', href: ROUTES.EXPLORE },
];

export function Header() {
  const pathname = usePathname();
  const { profile, isAuthenticated, signOut } = useAuth();
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // クリック外で閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-100 bg-gradient-to-r from-green-50 to-orange-50 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-1.5 text-xl font-bold"
          onClick={closeMobileNav}
        >
          <img src="/logo.png" alt="YatteMi!" className="h-10 w-10" />
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
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
                href={ROUTES.EXPLORE}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search className="h-5 w-5 text-gray-500" />
              </Link>

              <Link
                href={ROUTES.NOTIFICATIONS}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="h-5 w-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href={ROUTES.POST_NEW}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                投稿する
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-orange-600 font-medium">
                        {profile?.display_name?.[0]?.toUpperCase() ?? 'U'}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-gray-400 transition-transform',
                    isDropdownOpen && 'rotate-180'
                  )} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium text-sm">{profile?.display_name}</p>
                      <p className="text-xs text-gray-500">@{profile?.username}</p>
                    </div>
                    <Link
                      href={ROUTES.PROFILE}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      プロフィール
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      管理
                    </Link>
                    <Link
                      href={ROUTES.APPLICATIONS}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      応募管理
                    </Link>
                    <Link
                      href="/matches"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      メッセージ
                    </Link>
                    <div className="border-t my-1" />
                    <Link
                      href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      設定
                    </Link>
                    <div className="border-t my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      ログアウト
                    </button>
                  </div>
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:shadow-lg transition-all"
              >
                新規登録
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={toggleMobileNav}
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
                onClick={closeMobileNav}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    投稿する
                  </Link>
                  <Link
                    href={ROUTES.NOTIFICATIONS}
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <Bell className="h-5 w-5 text-gray-500" />
                    通知
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    プロフィール
                  </Link>
                  <Link
                    href={ROUTES.APPLICATIONS}
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <FileText className="h-5 w-5 text-gray-500" />
                    応募管理
                  </Link>
                  <Link
                    href="/matches"
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    メッセージ
                  </Link>
                  <Link
                    href="/settings"
                    onClick={closeMobileNav}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100"
                  >
                    <Settings className="h-5 w-5 text-gray-500" />
                    設定
                  </Link>
                </div>
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobileNav();
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
                  onClick={closeMobileNav}
                  className="block px-4 py-3 rounded-xl text-center font-medium hover:bg-gray-100"
                >
                  ログイン
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  onClick={closeMobileNav}
                  className="block px-4 py-3 rounded-xl text-center font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white"
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
