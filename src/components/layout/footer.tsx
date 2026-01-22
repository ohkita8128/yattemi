import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🎯</span>
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              YatteMi!
            </span>
          </Link>

          {/* Links */}
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href={ROUTES.EXPLORE} className="hover:text-gray-900">
              投稿を探す
            </Link>
            <Link href={ROUTES.POST_NEW} className="hover:text-gray-900">
              投稿する
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © 2024 YatteMi! All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}