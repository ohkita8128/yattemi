'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Target, Palette } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import Image from 'next/image';

const features = [
  { icon: Sparkles, text: '自分の好きを、誰かに届ける' },
  { icon: Target, text: '新しい趣味・スキルに気軽に挑戦' },
  { icon: Palette, text: '料理、楽器、伝統工芸、推し活...何でもOK' },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="min-h-screen flex">
      {/* 左側: ブランドエリア（PCのみ表示） */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 relative overflow-hidden">
        {/* 装飾の円 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-white/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg" />

        {/* コンテンツ */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          {/* ロゴ（大きめ） */}
          <Link href={ROUTES.HOME} className="flex items-center gap-4 mb-12">
            <Image
              src="/logo-56.png"
              alt="YatteMi!"
              width={56}
              height={56}
              priority           // ← LCP要素なので最優先
              className="h-14 w-14"
            />
            <span className="text-4xl font-bold">YatteMi!</span>
          </Link>

          {/* キャッチコピー */}
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            「やってみたい」を
            <br />
            「やってみた」に
          </h1>

          {/* サブコピー */}
          <p className="text-lg text-white/90 mb-10 max-w-lg leading-relaxed">
            好きを広めたい人と、新しいことを始めたい人を繋ぐ。
            <br />
            あなたの得意で、誰かのチャレンジを応援しよう。
          </p>

          {/* 特徴 */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右側: フォームエリア */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* スマホ用ヘッダー（LG以下で表示） */}
        <header className="lg:hidden border-b bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 font-display text-xl font-bold"
            >
              <Image
                src="/logo-40.png"
                alt="YatteMi!"
                width={40}
                height={40}
                priority
                className="h-10 w-10"
              />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent text-2xl">
                YatteMi!
              </span>
            </Link>
            <Link
              href={isLogin ? ROUTES.REGISTER : ROUTES.LOGIN}
              className="text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              {isLogin ? '新規登録' : 'ログイン'}
            </Link>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* フッター */}
        <footer className="py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} YatteMi! All rights reserved.
        </footer>
      </div>
    </div>
  );
}