# YatteMi! 引継ぎ資料 - Phase 10（完全版）

## 基本情報
- **本番URL**: https://yattemi.vercel.app
- **ローカル**: `C:\Users\PC_User\Documents\GitHub\yattemi`
- **技術スタック**: Next.js 14 + TypeScript + Tailwind + Supabase + Vercel
- **日付**: 2026/01/28-29

---

## Phase 10 完了タスク一覧

| タスク | 状態 |
|--------|------|
| LCP大幅改善 | ✅ |
| PWA対応 | ✅ |
| チャットUI修正（fixed構造） | ✅ |
| オンボーディング刷新 | ✅ |
| リコメンド改善 | ✅ |
| 画像アスペクト比修正 | ✅ |

---

## 1. LCP大幅改善 🚀

### 成果

| 指標 | Before | After | 改善 |
|------|--------|-------|------|
| **Performance** | 66 | **87** | +21pt |
| **LCP** | 5.6秒 | **2.6秒** | -54% |
| **FCP** | 4.9秒 | **0.9秒** | -82% |
| フォントファイル | 23個 | **0個** | -100% |

### 1-1. フォント最適化

**問題**: Google Fonts（Inter, Noto Sans JP, Outfit）が23個のフォントファイルを読み込んでいた

**解決**: システムフォントに切り替え

```typescript
// tailwind.config.ts
fontFamily: {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Hiragino Sans',
    'Hiragino Kaku Gothic ProN',
    'Yu Gothic UI',
    'Meiryo',
    'sans-serif',
  ],
},
```

### 1-2. 画像最適化

`<img>` → Next.js `<Image>` に変更

| ファイル | 箇所 | サイズ指定 |
|----------|------|-----------|
| `post-card.tsx` | アバター、投稿画像 | 72x72, 400x300 |
| `header.tsx` | アバター | 72x72 |
| `dashboard/page.tsx` | アバター（4箇所） | 32x32 |
| `posts/[id]/page.tsx` | 画像（4箇所） | 800x600, 1200x900 |
| `matches/[id]/page.tsx` | アバター | 80x80 |

**パターン**:
```tsx
// undefinedの可能性がある場合は ! を付ける
<Image 
  src={url!}
  alt=""
  width={72}   // 表示サイズの2倍
  height={72}
  className="h-9 w-9 object-cover"
/>
```

---

## 2. PWA対応 📱

### 追加ファイル

**public/manifest.json**
```json
{
  "name": "YatteMi! - スキルシェア",
  "short_name": "YatteMi!",
  "description": "「やってみたい」を「やってみた」に",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [{ "src": "/logo.png", "sizes": "400x400", "type": "image/png" }]
}
```

**src/app/layout.tsx に追加**
```tsx
export const metadata: Metadata = {
  // ...既存の設定
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YatteMi!',
  },
};

// <head>内
<link rel="apple-touch-icon" href="/logo.png" />
```

**使い方（iPhone）**
1. Safariでサイトを開く
2. 共有ボタン → 「ホーム画面に追加」
3. アプリとして開くとアドレスバーなし

---

## 3. チャットUI修正（fixed構造）💬

### 問題
スマホでヘッダー・入力欄が固定されない

### 解決
`flex-none` → `fixed` に変更

**src/app/(main)/matches/[id]/page.tsx**
```tsx
return (
  <div className="bg-white">
    {/* ヘッダー - 固定 */}
    <header className="fixed top-0 left-0 right-0 z-30 border-b bg-white">
      {/* 内容 */}
    </header>

    {/* メッセージ - スクロール */}
    <main 
      className="min-h-screen overflow-y-auto bg-white"
      style={{ 
        paddingTop: showPostDetail ? '220px' : '120px',
        paddingBottom: '80px' 
      }}
    >
      {/* 内容 */}
    </main>

    {/* 入力欄 - 固定 */}
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white">
      {/* 内容 */}
    </footer>
  </div>
);
```

**src/app/(main)/layout.tsx**
```tsx
if (isChatPage) {
  return (
    <div className="h-[100dvh]">
      {children}
    </div>
  );
}
```

---

## 4. オンボーディング刷新 🎉

### 新しいステップ構成（4ステップ）

| Step | 内容 | 必須 |
|------|------|------|
| 1 | アイコン + 名前 | 名前のみ必須 |
| 2 | 興味カテゴリ選択 | 3つ以上必須 |
| 3 | 傾向（教えたい/学びたい/両方） | 必須 |
| 4 | 学校情報 | 任意 |

### 新機能
- ✅ **画像切り取り**（react-image-crop使用、丸く選択可能）
- ✅ **カテゴリ選択UI**（アイコン付きグリッド）
- ✅ **傾向選択**（大きなカード）
- ✅ **完了後 → explore へ**

### 追加パッケージ
```bash
npm install react-image-crop
```

### DB変更

**新テーブル: user_interests**
```sql
CREATE TABLE user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category_id integer REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, category_id)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_category ON user_interests(category_id);
```

**profilesテーブルに追加**
```sql
ALTER TABLE profiles 
ADD COLUMN preference text DEFAULT 'both' 
CHECK (preference IN ('support', 'challenge', 'both'));
```

---

## 5. リコメンド改善 🎯

### 改善点

| Before | After |
|--------|-------|
| いいね履歴のみ | **user_interests** + いいね履歴 |
| 人気順 | **興味カテゴリ内で新しい順** |

### ロジック

```
1. user_interests から興味カテゴリ取得（オンボーディングで選んだやつ）
2. likes から行動ベースのカテゴリ取得（いいねした投稿のカテゴリ）
3. 両方を合体 → 興味カテゴリリスト
4. そのカテゴリの投稿を新しい順で取得
5. 足りなければ人気投稿で補完
```

### 変更ファイル
- `src/hooks/use-recommendations.ts`

---

## 6. 画像アスペクト比修正（Twitter風）📷

### post-card.tsx
```tsx
// 1枚
<div className="rounded-md overflow-hidden aspect-[3/2]">

// 複数枚
post.images.length === 2 
  ? "grid-cols-2 aspect-[3/1]" 
  : "grid-cols-2 grid-rows-2 aspect-[4/3]"
```

### posts/[id]/page.tsx
```tsx
<div className={`rounded-xl overflow-hidden border ${
  images.length === 1 
    ? '' 
    : images.length === 2 
      ? 'grid gap-0.5 grid-cols-2 aspect-[2/1]' 
      : 'grid gap-0.5 grid-cols-2 grid-rows-2 aspect-[4/3]'
}`}>
```

### アスペクト比の選択肢

| クラス | 比率 | 見た目 |
|--------|------|--------|
| `aspect-video` | 16:9 | 横長（YouTube風） |
| `aspect-[3/2]` | 3:2 | Twitter風 |
| `aspect-[4/3]` | 4:3 | やや横長 |
| `aspect-square` | 1:1 | 正方形（Instagram風） |

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|---------|
| `src/app/layout.tsx` | フォント削除、PWA設定追加 |
| `tailwind.config.ts` | システムフォント設定 |
| `public/manifest.json` | 新規作成（PWA） |
| `src/styles/globals.css` | from-primary-500 → from-orange-500 |
| `src/app/(main)/layout.tsx` | チャットページ用レイアウト |
| `src/app/(main)/matches/[id]/page.tsx` | fixed構造に変更 |
| `src/app/(main)/onboarding/page.tsx` | 全面刷新 |
| `src/app/(main)/posts/[id]/page.tsx` | Image最適化、アスペクト比 |
| `src/components/posts/post-card.tsx` | Image最適化、アスペクト比 |
| `src/components/layout/header.tsx` | Image最適化 |
| `src/app/(main)/dashboard/page.tsx` | Image最適化 |
| `src/hooks/use-recommendations.ts` | user_interests対応 |

---

## 残タスク

| 優先度 | タスク | 備考 |
|--------|--------|------|
| **高** | ブロック機能 | 未着手 |
| **高** | 実機テスト | PWA、チャットUI、オンボーディング確認 |
| **中** | 残りの`<img>`タグ修正 | 約15箇所残り |
| **低** | TypeScript any型修正 | |

### 残りの`<img>`タグ（中優先度で後日対応）
```
src\app\(main)\applications\page.tsx
src\app\(main)\onboarding\page.tsx（アバタープレビュー部分）
src\app\(main)\profile\edit\page.tsx
src\app\(main)\users\[username]\page.tsx
src\app\(main)\users\[username]\follows\page.tsx
src\components\applications\application-card.tsx
src\components\posts\post-form.tsx
src\components\profile\profile-image-gallery.tsx
src\components\profile\profile-image-viewer.tsx
src\components\reviews\review-form.tsx
src\components\session\session-chat.tsx
```

---

## 技術メモ

### Next.js Image使用時の注意
- `fill` と `h-full` の組み合わせはグリッドで高さ0になることがある
- → `width/height` + `className="w-full h-full object-cover"` が安全
- undefinedの可能性がある場合は `!` を付ける

### iOS対応
- `h-screen` (100vh) はiOSでアドレスバーを含む
- → `h-[100dvh]` を使う（Dynamic Viewport Height）

### TypeScript Set のスプレッド
```tsx
// ❌ エラー
const arr = [...new Set([1, 2, 3])];

// ✅ 正しい
const arr = Array.from(new Set([1, 2, 3]));
```

### react-image-crop
```tsx
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
```

---

## 今日の成果サマリー

```
Performance: 66 → 87 (+21)
LCP: 5.6秒 → 2.6秒 (-54%)
FCP: 4.9秒 → 0.9秒 (-82%)

新機能:
- PWA対応（ホーム画面追加可能）
- チャットUI改善（LINEみたいに固定）
- オンボーディング刷新（カテゴリ選択、画像切り取り）
- パーソナライズドレコメンド
- Twitter風画像表示
```

---

## 過去の引継ぎ資料
- Phase 9: チャットUI改善、OGP、SEO
- Phase 8: ダッシュボード刷新、ボトムナビ
- Phase 7以前: 基本機能実装

---

## 次回やること
1. ブロック機能
2. 実機テスト（特にiPhoneでのPWA、チャット、オンボーディング）
3. 残りの画像最適化（余裕があれば）
