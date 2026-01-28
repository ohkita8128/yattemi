# YatteMi! 技術設計書 v3.0
## 企業レベルプロダクション仕様（2025年1月更新）

---

## 1. プロジェクト概要

### 1.1 ミッション
「やってみたい」を「やってみた」に変える。
趣味・技術を教えたい人と学びたい人をつなぐスキルシェアプラットフォーム。

### 1.2 ターゲットユーザー
- **プライマリ**: 大学生（18-24歳）
- **セカンダリ**: 若手社会人、副業希望者

### 1.3 コアバリュー
1. **シンプル**: 3クリックで投稿完了
2. **安心**: 大学生同士のコミュニティ
3. **発見**: 新しい趣味・スキルとの出会い

### 1.4 プロジェクト情報
| 項目 | 値 |
|------|-----|
| リポジトリ | https://github.com/ohkita8128/yattemi |
| 本番URL | https://yattemi.vercel.app |
| Supabase | https://lbdrqjhifussacjgwnij.supabase.co |

---

## 2. 技術スタック（確定版）

| レイヤー | 技術 | バージョン | 理由 |
|---------|------|-----------|------|
| フレームワーク | Next.js | 14.x (App Router) | SSR/ISR、SEO最適化 |
| 言語 | TypeScript | 5.x | 型安全性 |
| スタイリング | Tailwind CSS | 3.x | 高速開発、一貫性 |
| UIコンポーネント | shadcn/ui | latest | アクセシビリティ、カスタマイズ性 |
| アイコン | Lucide React | latest | 軽量、一貫性 |
| 状態管理 | Zustand | 4.x | シンプル、軽量 |
| フォーム | React Hook Form + Zod | latest | バリデーション |
| BaaS | Supabase | latest | Auth、DB、Storage、Realtime |
| デプロイ | Vercel | - | Next.js最適化 |
| トースト | Sonner | latest | 軽量な通知UI |

### 2.1 重要な実装ノート

#### RadixUI使用時の注意
- `Button` の `asChild` プロパティは使用しない（`React.Children.only` エラー回避）
- 代わりに直接 `Link` コンポーネントにスタイルを適用

```typescript
// ❌ NG - エラーが発生する
<Button asChild><Link href="/path">テキスト</Link></Button>

// ✅ OK - 直接Linkを使用
<Link href="/path" className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-orange-500 text-white font-medium">
  テキスト
</Link>
```

#### useSearchParams使用時の注意
- 必ず `Suspense` でラップする（Next.js 14要件）

```typescript
// ❌ NG
export default function Page() {
  const searchParams = useSearchParams();
  // ...
}

// ✅ OK
function PageContent() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

#### Supabaseクエリの型エラー回避
- 厳密な型定義でエラーが出る場合は `as any` を使用

```typescript
// 型エラーが出る場合
const { data, error } = await (supabase as any)
  .from('applications')
  .insert({ post_id, applicant_id, message });
```

---

## 3. データベース設計

### 3.1 ER図（テキスト表現）

```
┌─────────────────┐       ┌─────────────────┐
│     profiles    │       │      posts      │
├─────────────────┤       ├─────────────────┤
│ id (PK, FK)     │──┐    │ id (PK)         │
│ username        │  │    │ user_id (FK)    │──┐
│ display_name    │  │    │ title           │  │
│ avatar_url      │  │    │ description     │  │
│ bio             │  │    │ type            │  │
│ university      │  │    │ category_id(FK) │  │
│ created_at      │  │    │ status          │  │
│ updated_at      │  │    │ max_applicants  │  │
└─────────────────┘  │    │ created_at      │  │
                     │    │ updated_at      │  │
                     │    └─────────────────┘  │
                     │             │           │
                     │             ▼           │
                     │    ┌─────────────────┐  │
                     │    │      likes      │  │ ← NEW
                     │    ├─────────────────┤  │
                     │    │ id (PK)         │  │
                     │    │ user_id (FK)    │◀─┤
                     │    │ post_id (FK)    │◀─┘
                     │    │ created_at      │
                     │    └─────────────────┘
                     │
                     │    ┌─────────────────┐
                     │    │   categories    │
                     │    ├─────────────────┤
                     │    │ id (PK)         │
                     │    │ name            │
                     │    │ slug            │
                     │    │ icon            │
                     │    │ color           │
                     │    └─────────────────┘
                     │
                     │    ┌─────────────────┐
                     └───▶│  applications   │◀─┐
                          ├─────────────────┤  │
                          │ id (PK)         │  │
                          │ post_id (FK)    │  │
                          │ applicant_id(FK)│  │
                          │ message         │  │
                          │ status          │  │
                          │ created_at      │  │
                          │ updated_at      │  │
                          └─────────────────┘  │
                                   │           │
                                   ▼           │
                          ┌─────────────────┐  │
                          │     matches     │  │
                          ├─────────────────┤  │
                          │ id (PK)         │  │
                          │ application_id  │  │
                          │ status          │  │
                          │ matched_at      │  │
                          │ completed_at    │  │
                          └─────────────────┘  │
                                   │           │
                                   ▼           │
                          ┌─────────────────┐  │
                          │    messages     │  │ ← NEW
                          ├─────────────────┤  │
                          │ id (PK)         │  │
                          │ match_id (FK)   │  │
                          │ sender_id (FK)  │◀─┤
                          │ content         │  │
                          │ is_read         │  │
                          │ created_at      │  │
                          └─────────────────┘  │
                                   │           │
                                   ▼           │
                          ┌─────────────────┐  │
                          │     reviews     │  │
                          ├─────────────────┤  │
                          │ id (PK)         │  │
                          │ match_id (FK)   │  │
                          │ reviewer_id(FK) │◀─┤
                          │ reviewee_id(FK) │◀─┘
                          │ rating          │
                          │ comment         │
                          │ created_at      │
                          └─────────────────┘

                          ┌─────────────────┐
                          │  notifications  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ user_id (FK)    │
                          │ type            │
                          │ title           │
                          │ message         │
                          │ link            │
                          │ is_read         │
                          │ created_at      │
                          └─────────────────┘
```

### 3.2 テーブル定義

#### profiles（ユーザープロフィール）
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  department TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  twitter_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_university ON profiles(university);
```

#### categories（カテゴリマスタ）
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ
INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('プログラミング', 'programming', 'Code', '#3B82F6', 1),
  ('デザイン', 'design', 'Palette', '#EC4899', 2),
  ('音楽', 'music', 'Music', '#8B5CF6', 3),
  ('スポーツ', 'sports', 'Trophy', '#10B981', 4),
  ('語学', 'language', 'Globe', '#F59E0B', 5),
  ('料理', 'cooking', 'UtensilsCrossed', '#EF4444', 6),
  ('写真・動画', 'media', 'Camera', '#6366F1', 7),
  ('ビジネス', 'business', 'Briefcase', '#14B8A6', 8),
  ('アート', 'art', 'Brush', '#F97316', 9),
  ('ゲーム', 'gaming', 'Gamepad2', '#A855F7', 10),
  ('勉強', 'study', 'BookOpen', '#22C55E', 11),
  ('その他', 'other', 'Sparkles', '#6B7280', 99);
```

#### posts（投稿）
```sql
CREATE TYPE post_type AS ENUM ('teach', 'learn');
CREATE TYPE post_status AS ENUM ('open', 'closed', 'completed', 'cancelled');

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 2000),
  type post_type NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  status post_status DEFAULT 'open',
  max_applicants INTEGER DEFAULT 1 CHECK (max_applicants >= 1 AND max_applicants <= 10),
  location TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  preferred_schedule TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

#### likes（いいね）← NEW
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

#### applications（応募）
```sql
-- ⚠️ 重要: statusは 'accepted' を使用（'approved' ではない）
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT CHECK (char_length(message) <= 500),
  status application_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, applicant_id)
);

CREATE INDEX idx_applications_post_id ON applications(post_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
```

#### matches（マッチング成立）
```sql
CREATE TYPE match_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status match_status DEFAULT 'active',
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

CREATE INDEX idx_matches_application_id ON matches(application_id);
CREATE INDEX idx_matches_status ON matches(status);
```

#### messages（メッセージ）← NEW
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### reviews（レビュー）
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

#### notifications（通知）
```sql
CREATE TYPE notification_type AS ENUM (
  'new_application',
  'application_accepted',
  'application_rejected',
  'match_completed',
  'new_review',
  'new_message',
  'system'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 3.3 RLS（Row Level Security）ポリシー

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "自分のプロフィールのみ更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "認証ユーザーはプロフィール作成可能" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公開投稿は誰でも閲覧可能" ON posts
  FOR SELECT USING (status != 'cancelled');

CREATE POLICY "認証ユーザーは投稿可能" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の投稿のみ更新可能" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "自分の投稿のみ削除可能" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "いいねは誰でも閲覧可能" ON likes
  FOR SELECT USING (true);

CREATE POLICY "認証ユーザーはいいね可能" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のいいねは削除可能" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証ユーザーは応募可能" ON applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "応募は関係者のみ閲覧可能" ON applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
  );

CREATE POLICY "応募者は自分の応募をキャンセル可能" ON applications
  FOR UPDATE USING (auth.uid() = applicant_id);

CREATE POLICY "投稿者は応募ステータスを更新可能" ON applications
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
  );

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "メッセージは関係者のみ閲覧可能" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT a.applicant_id FROM applications a
      JOIN matches m ON m.application_id = a.id
      WHERE m.id = match_id
      UNION
      SELECT p.user_id FROM posts p
      JOIN applications a ON a.post_id = p.id
      JOIN matches m ON m.application_id = a.id
      WHERE m.id = match_id
    )
  );

CREATE POLICY "関係者はメッセージ送信可能" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT a.applicant_id FROM applications a
      JOIN matches m ON m.application_id = a.id
      WHERE m.id = match_id
      UNION
      SELECT p.user_id FROM posts p
      JOIN applications a ON a.post_id = p.id
      JOIN matches m ON m.application_id = a.id
      WHERE m.id = match_id
    )
  );

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "通知は本人のみ閲覧可能" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "認証ユーザーは通知作成可能" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "本人は通知を更新可能" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "本人は通知を削除可能" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 4. ディレクトリ構造

```
yatte-mi/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/
│   │   │   ├── page.tsx                    # ホーム
│   │   │   ├── explore/page.tsx            # 投稿一覧
│   │   │   ├── posts/
│   │   │   │   ├── new/page.tsx            # 新規投稿
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx            # 投稿詳細
│   │   │   │       └── edit/page.tsx       # 投稿編集
│   │   │   ├── applications/page.tsx       # 応募管理
│   │   │   ├── matches/
│   │   │   │   ├── page.tsx                # マッチング一覧
│   │   │   │   └── [id]/page.tsx           # チャット
│   │   │   ├── notifications/page.tsx      # 通知
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx                # マイプロフィール
│   │   │   │   └── edit/page.tsx           # プロフィール編集
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── auth/callback/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn/ui
│   │   │   ├── button.tsx                  # ※ asChild未使用版
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx                  # ※ RadixUI未使用版
│   │   │   └── footer.tsx
│   │   ├── posts/
│   │   │   ├── post-card.tsx
│   │   │   ├── post-form.tsx
│   │   │   ├── post-list.tsx
│   │   │   ├── like-button.tsx             # NEW
│   │   │   └── index.ts
│   │   └── applications/
│   │       ├── application-card.tsx
│   │       ├── application-dialog.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-posts.ts
│   │   ├── use-applications.ts
│   │   ├── use-likes.ts                    # NEW
│   │   ├── use-messages.ts                 # NEW
│   │   └── index.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── index.ts
│   │   │   └── errors.ts
│   │   └── validations/
│   │       ├── auth.ts
│   │       ├── post.ts
│   │       └── profile.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── notification-store.ts
│   │   ├── ui-store.ts
│   │   └── index.ts
│   └── types/
│       ├── database.ts
│       └── index.ts
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_rls_and_functions.sql
│       └── 003_likes_messages.sql          # NEW
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. ページ・機能一覧

### 5.1 実装済みページ

| パス | 説明 | 認証 |
|------|------|------|
| `/` | ホーム・ランディング | 不要 |
| `/login` | ログイン | 不要 |
| `/register` | 新規登録 | 不要 |
| `/explore` | 投稿一覧・検索 | 不要 |
| `/posts/new` | 新規投稿作成 | 必要 |
| `/posts/[id]` | 投稿詳細 | 不要 |
| `/posts/[id]/edit` | 投稿編集（フル機能） | 必要（所有者のみ） |
| `/applications` | 応募管理（送信/受信） | 必要 |
| `/matches` | マッチング一覧 | 必要 |
| `/matches/[id]` | チャット | 必要（関係者のみ） |
| `/notifications` | 通知一覧 | 必要 |
| `/profile` | マイプロフィール | 必要 |
| `/profile/edit` | プロフィール編集 | 必要 |

### 5.2 機能一覧

| 機能 | 状態 | 備考 |
|------|------|------|
| メール/パスワード認証 | ✅ 完了 | |
| Google OAuth | ✅ 完了 | |
| GitHub OAuth | ✅ 完了 | |
| 投稿作成 | ✅ 完了 | |
| 投稿編集（フル機能） | ✅ 完了 | 応募有無で編集制限 |
| 投稿削除 | ✅ 完了 | |
| 投稿一覧・検索 | ✅ 完了 | |
| 応募機能 | ✅ 完了 | 重複応募チェック |
| 応募承認/却下 | ✅ 完了 | |
| マッチング作成 | ✅ 完了 | 承認時自動作成 |
| リアルタイムチャット | ✅ 完了 | Supabase Realtime |
| いいね機能 | ✅ 完了 | |
| 通知機能 | ✅ 完了 | |
| プロフィール編集 | ✅ 完了 | |
| レビュー機能 | 🔲 未実装 | |
| ユーザープロフィール公開 | 🔲 未実装 | `/profile/[username]` |

---

## 6. カスタムフック一覧

### 6.1 use-auth.ts
```typescript
export function useAuth() {
  return {
    user,           // User | null
    profile,        // Profile | null
    isAuthenticated,// boolean
    isLoading,      // boolean
    signIn,         // (email, password) => Promise
    signUp,         // (email, password, metadata) => Promise
    signInWithOAuth,// (provider) => Promise
    signOut,        // () => Promise
  };
}
```

### 6.2 use-posts.ts
```typescript
export function usePost(postId: string) {
  return { post, isLoading, error };
}

export function usePosts(filters) {
  return { posts, isLoading, error };
}

export function useCreatePost() {
  return { createPost, isSubmitting };
}

export function useCategories() {
  return { categories, isLoading };
}
```

### 6.3 use-applications.ts
```typescript
export function useMyApplications() {
  return { applications, isLoading, refetch };
}

export function useReceivedApplications() {
  return { applications, isLoading, refetch };
}

export function useCreateApplication() {
  return { createApplication, isSubmitting };
}

export function useUpdateApplicationStatus() {
  return { updateStatus, isUpdating };
}
```

### 6.4 use-likes.ts
```typescript
export function useLikes(postId: string) {
  return { likesCount, isLiked, isLoading, toggleLike };
}

export function useMyLikedPosts() {
  return { posts, isLoading };
}
```

### 6.5 use-messages.ts
```typescript
export function useMessages(matchId: string) {
  return { 
    messages,       // Message[]
    isLoading,
    sendMessage,    // (content) => Promise
    markAsRead,     // () => Promise
    refetch,
  };
}
```

---

## 7. 既知の問題と対策

### 7.1 エラー対策まとめ

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `React.Children.only expected single element` | RadixUI の `asChild` + 条件分岐 | Radix使わないシンプル版に置換 |
| `approved` が存在しない | 型は `accepted` なのにキーが `approved` | `statusConfig` のキーを `accepted` に統一 |
| `401 Unauthorized` (応募) | fetchでANON_KEY使用、RLS通らない | `supabase.from().insert()` を使う |
| `row violates RLS policy` | RLSポリシー未設定 | SQL Editorでポリシー追加 |
| 型エラー `never` | Supabase型定義が厳しい | `as any` を追加 |
| `useSearchParams` エラー | Suspense未使用 | コンポーネントを `Suspense` でラップ |
| `CookieOptions declared but never read` | 未使用のimport | importから削除 |
| `options implicitly has any type` | 型未指定 | `{ name: string; value: string; options?: any }[]` |

---

## 8. 開発フェーズ進捗

### Phase 1: 基盤 ✅ 完了
- [x] 技術設計書作成
- [x] プロジェクトセットアップ
- [x] DB設計・マイグレーション
- [x] 認証実装
- [x] 基本UI（shadcn/ui）

### Phase 2: コア機能 ✅ 完了
- [x] プロフィール機能
- [x] 投稿CRUD
- [x] 投稿一覧・検索
- [x] 投稿詳細

### Phase 3: マッチング ✅ 完了
- [x] 応募機能
- [x] 応募管理
- [x] マッチング成立

### Phase 3.5: 追加機能 ✅ 完了
- [x] いいね機能
- [x] メッセージ/チャット機能
- [x] 通知ページ
- [x] プロフィール編集
- [x] 投稿編集（フル機能版）

### Phase 4: 完成度向上 🔲 未着手
- [ ] レビュー機能
- [ ] ユーザープロフィール公開
- [ ] UIブラッシュアップ
- [ ] テスト追加

---

## 9. 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Auth
NEXT_PUBLIC_SITE_URL=https://yattemi.vercel.app
```

---

## 10. デプロイ

### Vercel設定
1. GitHub連携
2. 環境変数設定
3. 自動デプロイ（mainブランチ）

### Supabase設定
- Authentication: Email、Google、GitHub
- Database: PostgreSQL
- Row Level Security: 有効

---

以上が YatteMi! の技術設計書 v3.0 です。
最終更新: 2025年1月
