// src/app/layout.tsx
// 🚀 LCP最適化版 - システムフォント使用（Google Fonts削除）

import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '@/styles/globals.css';
import { APP_CONFIG } from '@/lib/constants';

// ✅ Google Fontsを使わない = フォントファイル0個

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
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