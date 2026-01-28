# YatteMi! 引き継ぎ資料

**最終更新**: 2026年1月24日  
**バージョン**: Phase 4 完了

---

## 1. プロジェクト概要

### 1.1 サービス概要
YatteMi! はスキルシェアリングプラットフォーム。「教えたい人」と「学びたい人」をマッチングする。

### 1.2 基本情報
| 項目 | 値 |
|------|-----|
| 本番URL | https://yattemi.vercel.app |
| GitHub | （プライベートリポジトリ） |
| ローカルパス | `C:\Users\PC_User\Documents\GitHub\yattemi` |
| 連絡先メール | yattemi.official@gmail.com |

### 1.3 技術スタック
| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| ストレージ | Supabase Storage |
| ホスティング | Vercel |
| 画像圧縮 | browser-image-compression |

---

## 2. 今回のセッションで実装したもの（Phase 4）

### 2.1 投稿への画像添付機能

| 項目 | 内容 |
|------|------|
| DBカラム | `posts.images text[]` 追加 |
| Storageバケット | `post-images`（公開） |
| 最大枚数 | 4枚 |
| 対応ファイル | 画像ファイルのみ |
| サイズ制限 | 5MB以下（圧縮後は500KB程度） |

### 2.2 画像自動圧縮

全画像アップロード箇所に圧縮処理を追加：

| 箇所 | 圧縮設定 | ファイル |
|------|----------|----------|
| 投稿画像 | 1200px, 500KB | `post-form.tsx`, `posts/[id]/edit/page.tsx` |
| アバター | 400px, 200KB | `profile/edit/page.tsx`, `onboarding/page.tsx` |
| ギャラリー | 1200px, 500KB | `useProfileImages.ts` |

**圧縮ユーティリティ**: `src/lib/image-compression.ts`
```typescript
// 使用例
import { compressPostImage, compressAvatar, compressGalleryImage } from '@/lib/image-compression';

const compressedFile = await compressPostImage(file);
```

### 2.3 PostFormリファクタ

**Before**: `posts/new/page.tsx` に独自フォーム実装（重複コード）

**After**: `PostForm` コンポーネントを使用
```
src/components/posts/post-form.tsx  ← 共通フォームコンポーネント
src/app/(main)/posts/new/page.tsx   ← PostFormを使用（薄いラッパー）
src/app/(main)/posts/[id]/edit/page.tsx ← 独自実装（ロック機能あり）
```

**注意**: 編集ページは `isLocked` 制御があるため、PostFormへの統一は見送り

### 2.4 投稿詳細ページ リデザイン

**ファイル**: `src/app/(main)/posts/[id]/page.tsx`

| 改善点 | 内容 |
|--------|------|
| レイアウト | Twitter/X風のカード型 |
| 画像表示 | 1〜4枚対応のギャラリー |
| 画像モーダル | クリックで拡大表示 |
| ヘッダー | スティッキー + 戻るボタン |
| 情報表示 | レベル、形式、日程をカード化 |

### 2.5 無限スクロール

**ファイル**: `src/hooks/use-posts.ts`, `src/app/(main)/explore/page.tsx`

| 項目 | 値 |
|------|-----|
| 1回の読み込み | 12件（PAGE_SIZE） |
| トリガー | IntersectionObserver + 手動ボタン |
| 上限 | なし（投稿がある限り読み込み） |

**usePosts の返り値（更新後）**:
```typescript
const { 
  posts,          // 投稿配列
  isLoading,      // 初回読み込み中
  isLoadingMore,  // 追加読み込み中
  error,          // エラー
  hasMore,        // まだ投稿があるか
  loadMore,       // 追加読み込み関数
  refetch         // 再取得関数
} = usePosts({ ... });
```

### 2.6 表示オプションフィルター

**explore ページに追加**:

| フィルター | 説明 |
|------------|------|
| 締め切り済みも表示 | `includeClosed` - closed の投稿も表示 |
| 応募済みを非表示 | `hideApplied` - 自分が応募した投稿を非表示 |

### 2.7 テストデータ追加

| データ | 件数 |
|--------|------|
| テストユーザー | 6人 |
| テスト投稿 | 100件以上 |

---

## 3. データベース構造（更新）

### 3.1 主要テーブル
```
profiles          - ユーザープロフィール
posts             - 投稿（images カラム追加）
categories        - カテゴリ（17種類）
applications      - 応募
matches           - マッチング
messages          - メッセージ
notifications     - 通知
likes             - いいね
follows           - フォロー
reviews           - レビュー
profile_images    - ギャラリー画像
contact_inquiries - お問い合わせ
```

### 3.2 posts テーブル（更新）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | uuid | 投稿者ID |
| title | text | タイトル |
| description | text | 説明 |
| type | post_type (ENUM) | teach/learn |
| category_id | integer | カテゴリID |
| status | post_status (ENUM) | open/closed |
| max_applicants | integer | 募集人数 |
| is_online | boolean | オンライン対応 |
| location | text | 場所 |
| my_level | integer | 投稿者レベル (0-10) |
| target_level_min | integer | 募集レベル下限 |
| target_level_max | integer | 募集レベル上限 |
| tags | text[] | タグ配列 |
| available_days | text[] | 希望曜日 |
| available_times | text[] | 希望時間帯 |
| specific_dates | jsonb | 具体的日時 |
| **images** | **text[]** | **画像URL配列（NEW）** |
| view_count | integer | 閲覧数 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3.3 Supabase Storage バケット

| バケット名 | 用途 | 公開設定 |
|------------|------|----------|
| avatars | アバター画像 | Public |
| profile-images | ギャラリー画像 | Public |
| post-images | 投稿画像（NEW） | Public |

---

## 4. ファイル構成（主要）
```
src/
├── app/(main)/
│   ├── explore/page.tsx       # 投稿一覧（無限スクロール）
│   ├── posts/
│   │   ├── new/page.tsx       # 新規投稿（PostForm使用）
│   │   └── [id]/
│   │       ├── page.tsx       # 投稿詳細（リデザイン済み）
│   │       └── edit/page.tsx  # 投稿編集
│   ├── profile/edit/page.tsx  # プロフィール編集
│   ├── onboarding/page.tsx    # 初回設定
│   └── users/[username]/page.tsx # ユーザープロフィール
├── components/
│   ├── posts/
│   │   ├── post-card.tsx      # 投稿カード（画像対応）
│   │   └── post-form.tsx      # 投稿フォーム（共通）
│   └── profile/
│       └── profile-image-gallery.tsx # ギャラリー
├── hooks/
│   ├── use-posts.ts           # 投稿取得（無限スクロール対応）
│   └── useProfileImages.ts    # ギャラリー画像管理
└── lib/
    ├── image-compression.ts   # 画像圧縮ユーティリティ（NEW）
    └── validations/
        └── post.ts            # 投稿バリデーション（images追加）
```

---

## 5. よくあるエラーと対策

### 5.1 ビルドエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `'X' is declared but never read` | 未使用のimport | 該当importを削除 |
| `Type 'undefined' is not assignable` | null/undefinedチェック不足 | `|| null` や `?? default` を追加 |
| `column "X" is of type Y but expression is of type Z` | SQL型不一致 | `::post_type` 等でキャスト |
| 正規表現パターンが無効 | PowerShellでのエスケープ | 行番号指定で直接編集 |

### 5.2 ランタイムエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| 画像アップロード失敗 | バケットなし or RLS | Supabaseでバケット・ポリシー確認 |
| 406エラー | `.single()` で0件 | `.maybeSingle()` に変更 |
| 401 Unauthorized | RLS未設定 | ポリシー追加 |
| 無限スクロール動かない | IntersectionObserver | 手動ボタンで代替 |

### 5.3 PowerShell での編集時の注意
```powershell
# [id] を含むパスはエスケープが必要
Get-Content -LiteralPath "src\app\(main)\posts\[id]\page.tsx" -Encoding UTF8

# 正規表現が複雑な場合は行番号指定
$content = Get-Content "ファイル" -Encoding UTF8
$content[行番号] = '新しい内容'
$content | Set-Content "ファイル" -Encoding UTF8
```

---

## 6. 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド確認
npm run build

# デプロイ（自動）
git add .
git commit -m "コミットメッセージ"
git push origin main

# 画像圧縮ライブラリ
npm install browser-image-compression
```

---

## 7. 残タスク・今後の展開

### 7.1 優先度高

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| マッチング後の導線整理 | 現状フローがぐちゃぐちゃ | 高 |
| メッセージ機能改善 | リアルタイム通知など | 中 |

### 7.2 優先度中

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| teach/challenges の用途整理 | 現状何に使われてるか不明 | 調査 |
| likes_count キャッシュ | posts に likes_count カラム追加 | 低 |
| 古い通知の自動削除 | pg_cron で定期実行 | 低 |
| IntersectionObserver修正 | 手動ボタンなしで動くように | 中 |

### 7.3 優先度低

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| 通知の種類別フィルター | UIに追加 | 低 |
| 通知の複数選択削除 | UIに追加 | 低 |
| Supabase型生成 | `as any` 撲滅 | 中 |
| テスト追加 | Jest / Playwright | 高 |

### 7.4 将来展開アイデア

| 機能 | 説明 |
|------|------|
| レビュー・評価システム強化 | バッジ、実績表示 |
| 決済機能 | 有料レッスン対応（Stripe） |
| カレンダー連携 | Google Calendar同期 |
| ビデオ通話 | オンラインレッスン用 |
| AIマッチング | レベル・日程の自動マッチング提案 |
| PWA対応 | アプリっぽい体験 |
| 多言語対応 | i18n |

---

## 8. 次回チャットの開始テンプレート
```
YatteMi! 開発の続き

■ 前回完了（Phase 4）
- 投稿への画像添付機能
- 画像自動圧縮（投稿/アバター/ギャラリー）
- PostFormリファクタ
- 投稿詳細ページ Twitter風リデザイン
- 無限スクロール + 手動ボタン
- 締め切り/応募済みフィルター
- テスト投稿100件追加

■ 残タスク
1. マッチング後の導線整理（優先度高）
2. teach/challenges の用途整理
3. IntersectionObserver修正
4. likes_count キャッシュ

■ 技術スタック
Next.js 14 + TypeScript + Tailwind + Supabase + Vercel

■ ローカルパス
C:\Users\PC_User\Documents\GitHub\yattemi

■ 主要ファイル
- 投稿一覧: src/app/(main)/explore/page.tsx
- 投稿フォーム: src/components/posts/post-form.tsx
- usePosts: src/hooks/use-posts.ts
- 画像圧縮: src/lib/image-compression.ts
```

---

## 9. 環境変数

`.env.local` に必要：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

---

## 10. Supabase RLS ポリシーまとめ

### posts テーブル
- SELECT: 誰でも閲覧可
- INSERT: 認証ユーザーのみ
- UPDATE: 投稿者のみ
- DELETE: 投稿者のみ

### post-images バケット
- SELECT: 誰でも（Public）
- INSERT: 認証ユーザー
- DELETE: 認証ユーザー

---

*この資料は開発の引き継ぎ用です。*
*最終更新: 2026年1月24日*