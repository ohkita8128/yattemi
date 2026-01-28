// src/app/layout.tsx（最終版・全改善適用）
// Phase 1 + Phase 2 + アクセシビリティ改善

import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP, Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import '@/styles/globals.css';
import { APP_CONFIG } from '@/lib/constants';

// 🚀 改善1: フォント最適化
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',           // FOIT（Flash of Invisible Text）を防止
  preload: true,             // 最優先でプリロード
  fallback: ['sans-serif'],  // フォールバック指定
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
  weight: ['400', '500', '700'], // 必要なウェイトのみ指定でサイズ削減
  preload: false,            // サブフォントはプリロード不要
  fallback: ['sans-serif'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: false,
  fallback: ['sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ['スキルシェア', 'マッチング', '大学生', '趣味', '技術', '学習'],
  authors: [{ name: 'YatteMi! Team' }],
  verification: {
    google: 'az41pO7j5s4vekrMtcOrXfsDFjf91w2e34xmmRL6C88',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: [
      {
        url: 'https://yattemi.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YatteMi! - 好きを広めたい人と、新しいことを始めたい人を繋ぐ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: ['https://yattemi.vercel.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 🚀 改善2: アクセシビリティ改善（ズーム可能に）
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // ← 1から5に変更（視覚障害者対応）
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* 🚀 改善3: クリティカルCSSをインライン（LCP改善） */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-noto-sans: ${notoSansJP.style.fontFamily};
          }
          body { 
            margin: 0; 
            font-family: var(--font-inter), sans-serif;
            background-color: #fafafa;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* ファーストビューに必要な最小限のクラス */
          .min-h-screen { min-height: 100vh; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          /* 認証ページのグラデーション（LCP要素） */
          .auth-gradient {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%);
          }
        ` }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}