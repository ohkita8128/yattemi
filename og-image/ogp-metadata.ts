// app/layout.tsx に追加するメタデータ設定

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'YatteMi! - やってみたいを、やってみたに',
    template: '%s | YatteMi!',
  },
  description: '好きを広めたい人と、新しいことを始めたい人を繋ぐスキルシェアプラットフォーム。あなたの得意で、誰かのチャレンジを応援しよう。',
  keywords: ['スキルシェア', 'マッチング', '大学生', '教える', '学ぶ', 'サポート', 'チャレンジ'],
  authors: [{ name: 'YatteMi!' }],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://yattemi.vercel.app',
    siteName: 'YatteMi!',
    title: 'YatteMi! - やってみたいを、やってみたに',
    description: '好きを広めたい人と、新しいことを始めたい人を繋ぐスキルシェアプラットフォーム',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YatteMi! - スキルシェアプラットフォーム',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YatteMi! - やってみたいを、やってみたに',
    description: '好きを広めたい人と、新しいことを始めたい人を繋ぐスキルシェアプラットフォーム',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// ============================================
// 使い方:
// 1. 上記を app/layout.tsx の既存の metadata と統合
// 2. og-image.png を public/ フォルダに配置
// ============================================
