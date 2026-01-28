# YatteMi! 引継ぎ資料 - Phase 9

## 基本情報
- **本番URL**: https://yattemi.vercel.app
- **ローカル**: `C:\Users\wakel\Documents\ohkita\GitHub\yattemi`
- **技術スタック**: Next.js 14 + TypeScript + Tailwind + Supabase + Vercel
- **日付**: 2026/01/28

---

## Phase 9 完了タスク

### 1. チャットUI改善
- ✅ レイアウト修正（ヘッダー・入力欄固定、メッセージのみスクロール）
- ✅ 完了報告を投稿詳細内 + 初回表示バーに配置
- ✅ メニューは通報のみに簡略化
- ✅ layout.tsx でチャットページの BottomNav 非表示
- ✅ スマホ: `h-[100dvh]`、PC: `h-[calc(100vh-4rem)]`

**ファイル**: `src/app/(main)/matches/[id]/page.tsx`

### 2. チャットガイダンス追加
- ✅ メッセージ0件時にガイダンス表示
  - 流れの説明（4ステップ）
  - ヒント（LINE, Discord, Zoom等）
  - 注意書き（安全にご利用ください）
- ✅ テンプレメッセージボタン「はじめまして！よろしくお願いします 😊」
- ✅ メッセージ0件時は完了報告バー非表示

### 3. PostForm コンパクト化
- ✅ 全体間隔: `space-y-6` → `space-y-4`
- ✅ 投稿タイプ: 横並び、絵文字+ラベルのみ
- ✅ レベル設定: 2つを1カードにまとめ
- ✅ 募集人数: 小さいインラインステッパー
- ✅ 実施形式: セレクトボックス化
- ✅ 募集人数+形式を希望日程の上に移動

**ファイル**: `src/components/posts/post-form.tsx`

### 4. OGP設定
- ✅ OG画像作成（1200x630、白〜オレンジグラデーション）
- ✅ `public/og-image.png` に配置
- ✅ `layout.tsx` に images 追加

**確認**: https://yattemi.vercel.app/og-image.png

### 5. SEO対策
- ✅ `src/app/sitemap.ts` 作成
- ✅ `src/app/robots.ts` 作成
- ✅ Google Search Console 登録・確認完了
- ✅ middleware.ts で sitemap.xml, robots.txt を除外

**確認URL**:
- https://yattemi.vercel.app/sitemap.xml
- https://yattemi.vercel.app/robots.txt

### 6. 初回ロード速度調査
- TLSハンドシェイクが原因（3秒）= Vercel無料プランの限界
- サーバー処理（TTFB）は113msで高速
- 対策: UptimeRobot、Vercel Pro等（現状は許容範囲）

---

## 変更ファイル一覧

```
src/
├── app/
│   ├── layout.tsx              # OGP + Search Console verification
│   ├── sitemap.ts              # サイトマップ自動生成
│   ├── robots.ts               # robots.txt 自動生成
│   └── (main)/
│       ├── layout.tsx          # チャットページでBottomNav非表示
│       └── matches/[id]/page.tsx  # チャットUI改善
├── components/
│   └── posts/
│       └── post-form.tsx       # コンパクト化
├── middleware.ts               # sitemap.xml, robots.txt 除外
public/
└── og-image.png                # OG画像
```

---

## 残タスク

| 優先度 | タスク | 備考 |
|--------|--------|------|
| **高** | ブロック機能 | 未着手 |
| **中** | 実機テスト | UI変更の確認 |
| **中** | PostCard修正適用 | ステータスバッジを右寄せ |
| **低** | TypeScript any型修正 | |
| **低** | Twitter OGP確認 | キャッシュ待ち |

---

## 技術メモ

### middleware matcher
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### OGP設定
```tsx
// layout.tsx
openGraph: {
  images: [{
    url: '/og-image.png',
    width: 1200,
    height: 630,
    alt: 'YatteMi! - やってみたいを、やってみたに',
  }],
},
twitter: {
  card: 'summary_large_image',
  images: ['/og-image.png'],
},
verification: {
  google: 'az41pO7j5s4vekrMtcOrXfsDFjf91w2e34xmmRL6C88',
},
```

### チャットページ高さ
```tsx
// スマホ: ヘッダーなし → 100dvh
// PC: ヘッダーあり → calc(100vh - 4rem)
<div className="h-[100dvh] md:h-[calc(100vh-4rem)]">
```

---

## 過去の引継ぎ資料
- Phase 8: `/mnt/user-data/uploads/yattemi-handover-phase8.md`
- Phase 7: `/mnt/user-data/uploads/yattemi-handover-phase7.md`
- 総合: `/mnt/user-data/uploads/YATTEMI_HANDOVER.md`
