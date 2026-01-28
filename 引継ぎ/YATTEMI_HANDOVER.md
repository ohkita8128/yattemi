# YatteMi! プロジェクト引継ぎドキュメント

## 📋 プロジェクト概要

**YatteMi!** は大学生向けスキルシェアマッチングアプリ。学生同士が「教えたい」「学びたい」をマッチングする。

- **本番URL**: https://yattemi.vercel.app
- **ローカルパス**: `C:\Users\PC_User\Documents\GitHub\yattemi`
- **開発期間**: 約1週間（2026年1月時点）
- **ステータス**: MVP完成済み、ローンチ準備段階

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UI | shadcn/ui |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| ホスティング | Vercel |
| 状態管理 | Zustand（通知用） |

---

## 📁 ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/           # 認証ページ（login, register）
│   ├── (main)/           # メインページ（認証後）
│   │   ├── explore/      # 投稿探索
│   │   ├── posts/        # 投稿関連
│   │   │   ├── new/      # 新規投稿
│   │   │   └── [id]/     # 投稿詳細
│   │   ├── users/        # ユーザープロフィール
│   │   │   └── [username]/
│   │   ├── matches/      # チャット
│   │   │   └── [id]/     # 個別チャット
│   │   ├── applications/ # 応募管理
│   │   ├── notifications/# 通知
│   │   ├── dashboard/    # ダッシュボード
│   │   └── profile/      # プロフィール編集
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── layout/           # Header, BottomNav
│   ├── posts/            # PostCard, PostQuestions
│   ├── explore/          # SearchHeader, FilterSheet
│   └── common/           # ReportDialog など
├── hooks/
│   ├── index.ts          # エクスポート集約
│   ├── use-auth.ts       # 認証
│   ├── use-posts.ts      # 投稿取得
│   ├── use-likes.ts      # いいね
│   ├── use-messages.ts   # メッセージ
│   ├── use-tags.ts       # タグ取得
│   └── use-explore-filters.ts # 検索フィルター
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # ブラウザ用クライアント
│   │   └── server.ts     # サーバー用クライアント
│   ├── constants/
│   │   ├── routes.ts     # ルート定数
│   │   └── explore.ts    # 検索用定数
│   ├── utils/
│   │   ├── index.ts      # cn(), formatRelativeTime()
│   │   ├── date.ts       # 日付フォーマット
│   │   └── explore-date.ts # 検索用日付ユーティリティ
│   └── levels.ts         # レベルシステム
├── stores/
│   └── notification-store.ts # 通知状態（Zustand）
└── types/
    └── index.ts          # 型定義
```

---

## 🗄 データベース構造（Supabase）

### 主要テーブル

| テーブル | 説明 |
|----------|------|
| `profiles` | ユーザープロフィール |
| `posts` | 投稿（募集） |
| `applications` | 応募 |
| `matches` | マッチング |
| `messages` | チャットメッセージ |
| `notifications` | 通知 |
| `likes` | いいね |
| `follows` | フォロー |
| `post_questions` | 公開質問 |
| `reviews` | レビュー |
| `reports` | 通報 |
| `tags` | タグマスター |
| `categories` | カテゴリマスター |
| `profile_images` | プロフィール画像 |

### 重要なカラム

**posts テーブル**
```sql
- id: uuid
- user_id: uuid (profiles.id)
- title: text
- description: text
- type: 'support' | 'challenge'
- category_id: int
- status: 'open' | 'closed'
- is_online: boolean | null
- location: text
- my_level: int (0-10)
- target_level_min: int
- target_level_max: int
- available_days: text[] ('mon', 'tue', ...)
- available_times: text[] ('morning', 'afternoon', 'evening')
- tags: text[]
- images: text[]
- likes_count: int
- questions_count: int
- is_active: boolean
```

**applications テーブル**
```sql
- id: uuid
- post_id: uuid
- applicant_id: uuid
- message: text
- status: 'pending' | 'accepted' | 'rejected'
```

**matches テーブル**
```sql
- id: uuid
- application_id: uuid
- matched_at: timestamp
- completed_by: uuid (完了報告者)
- completed_at: timestamp
- confirmed_by: uuid (承認者)
- confirmed_at: timestamp
- status: 'active' | 'completed'
```

**reports テーブル**
```sql
- id: uuid
- reporter_id: uuid
- type: 'question' | 'post' | 'user' | 'message'
- target_id: uuid
- reason: 'spam' | 'inappropriate' | 'harassment' | 'dating' | 'scam' | 'personal_info' | 'impersonation' | 'other'
- detail: text
- status: 'pending' | 'reviewed' | 'resolved'
```

---

## ✅ 実装済み機能

### コア機能
- [x] メール/OAuth認証（Google）
- [x] プロフィール設定・編集
- [x] 投稿作成（サポート/チャレンジ）
- [x] 投稿一覧・検索・フィルター
- [x] 無限スクロール
- [x] 応募〜マッチング
- [x] リアルタイムチャット
- [x] 完了報告→レビュー
- [x] 通知システム
- [x] いいね・フォロー
- [x] 公開質問

### UI/UX
- [x] レスポンシブデザイン
- [x] ボトムナビ（モバイル）
- [x] 未読バッジ（通知・メッセージ）
- [x] iOS風セグメントコントロール
- [x] 緑×オレンジのテーマカラー

### セキュリティ
- [x] オープンリダイレクト対策
- [x] 通報機能（投稿・ユーザー・質問・チャット）
- [x] RLS（Row Level Security）

---

## 🚧 未実装・次回タスク

### 高優先度
| タスク | 詳細 |
|--------|------|
| 締め切り機能 | 手動締め切りボタン + 日時指定で自動締め切り |
| ブロック機能 | ユーザーブロック、投稿非表示 |
| 実機テスト | 一通りの動作確認 |

### 中優先度
| タスク | 詳細 |
|--------|------|
| OGP設定 | SNSシェア時の見た目 |
| エラーページ | 404, 500ページ |
| TypeScript any型修正 | Supabase周りのany削除 |

### 低優先度
| タスク | 詳細 |
|--------|------|
| プッシュ通知 | Web Push API |
| 管理画面 | 通報確認、ユーザー管理 |

---

## 🎨 デザインルール

### カラーパレット
| 用途 | 色 |
|------|-----|
| プライマリ | オレンジ (`orange-500`, `#f97316`) |
| セカンダリ | 緑 (`green-500`, `#22c55e`) |
| サポートタイプ | 緑 (`bg-green-100 text-green-700`) |
| チャレンジタイプ | オレンジ (`bg-orange-100 text-orange-700`) |
| ヘッダー | `bg-gradient-to-r from-green-50 to-orange-50` |

### コンポーネントスタイル
- セグメントコントロール: `bg-gray-100 p-1 rounded-xl` + アクティブ `bg-white shadow-sm`
- 丸い枠線ボタン: `border border-{color}-300 rounded-full`
- リスト: `divide-y` で区切り
- カード: `rounded-xl` または `rounded-md`

### アイコン
- Lucide React を使用
- サイズは基本 `h-4 w-4` または `h-5 w-5`

---

## ⚠️ 注意点・よくある問題

### 1. PowerShellでの動的ルート
```powershell
# ❌ エラーになる
Get-Content "...\posts\[id]\page.tsx"

# ✅ 正しい
Get-Content -LiteralPath "...\posts\[id]\page.tsx"
```

### 2. Supabaseのany型
現在、多くのSupabase呼び出しで `(supabase as any)` を使用。
```typescript
// 現状（型エラー回避のため）
const { data } = await (supabase as any)
  .from('posts')
  .select('*');

// 将来的に修正したい
const { data } = await supabase
  .from('posts')
  .select('*');
```

### 3. Hooksの使用場所
Hooksは必ずコンポーネント内で呼ぶ。ファイルのトップレベルで呼ぶとエラー。
```typescript
// ❌ エラー
const { tags } = useTags();
function MyComponent() { ... }

// ✅ 正しい
function MyComponent() {
  const { tags } = useTags();
  ...
}
```

### 4. flexboxで入力欄が広がりすぎる
`min-w-0` を追加する。
```tsx
<input className="min-w-0 flex-1 ..." />
```

### 5. ボトムナビに隠れる
モバイルでボトムナビがある場合、コンテンツに `pb-20` を追加。

### 6. キャッシュ問題
ビルドエラーが出たら `.next` を削除：
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 🔧 開発コマンド

```powershell
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# デプロイ（Vercel自動）
git add -A
git commit -m "メッセージ"
git push
```

---

## 📝 コーディング規約

### ファイル命名
- コンポーネント: `kebab-case.tsx` (例: `post-card.tsx`)
- hooks: `use-xxx.ts` (例: `use-posts.ts`)
- 型定義: `PascalCase` (例: `type Post = {...}`)

### コンポーネント構造
```tsx
'use client';  // 必要な場合

import { ... } from 'react';
import { ... } from 'next/navigation';
import { ... } from 'lucide-react';
import { ... } from '@/components/ui';
import { ... } from '@/hooks';
import { ... } from '@/lib/utils';

interface Props { ... }

export function ComponentName({ ... }: Props) {
  // hooks
  const [state, setState] = useState();
  
  // effects
  useEffect(() => { ... }, []);
  
  // handlers
  const handleClick = () => { ... };
  
  // render
  return ( ... );
}
```

### Tailwind CSS
- 基本的に既存のユーティリティクラスを使用
- カスタムCSSは最小限に
- レスポンシブ: `md:` プレフィックスでデスクトップ対応

---

## 🔗 重要なファイル

| ファイル | 説明 |
|----------|------|
| `src/hooks/index.ts` | hooks のエクスポート集約 |
| `src/lib/constants/routes.ts` | ルート定数 |
| `src/lib/supabase/client.ts` | Supabaseクライアント |
| `src/components/layout/header.tsx` | ヘッダー（通知・未読バッジ） |
| `src/components/layout/bottom-nav.tsx` | ボトムナビ |
| `src/app/(main)/explore/page.tsx` | 探索ページ（最近リファクタ済み） |

---

## 🚀 次のセッションで最初にやること

1. このドキュメントを読む
2. `npm run dev` で開発サーバー起動
3. https://yattemi.vercel.app で本番確認
4. 以下のタスクから着手：
   - 締め切り機能（手動+日時指定）
   - ブロック機能
   - 実機テスト

---

## 📞 質問があれば

ユーザーに確認すべきこと：
- デザインの方向性
- 機能の優先度
- 不明な仕様

過去の会話履歴も参照可能（conversation_search ツール使用）

---

*最終更新: 2026年1月27日*
