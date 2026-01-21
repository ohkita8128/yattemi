# YatteMi! 技術設計書 v2.0
## 企業レベルプロダクション仕様

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
| テスト | Vitest + Testing Library | latest | 高速、React対応 |

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
                     │                         │
                     │    ┌─────────────────┐  │
                     │    │   categories    │  │
                     │    ├─────────────────┤  │
                     │    │ id (PK)         │  │
                     │    │ name            │  │
                     │    │ slug            │  │
                     │    │ icon            │  │
                     │    │ color           │  │
                     │    └─────────────────┘  │
                     │                         │
                     │    ┌─────────────────┐  │
                     └───▶│  applications   │◀─┘
                          ├─────────────────┤
                          │ id (PK)         │
                          │ post_id (FK)    │
                          │ applicant_id(FK)│
                          │ message         │
                          │ status          │
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │     matches     │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ application_id  │
                          │ status          │
                          │ matched_at      │
                          │ completed_at    │
                          └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │     reviews     │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ match_id (FK)   │
                          │ reviewer_id(FK) │
                          │ reviewee_id(FK) │
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

-- インデックス
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

-- インデックス
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- 全文検索用
CREATE INDEX idx_posts_search ON posts 
  USING GIN(to_tsvector('japanese', title || ' ' || description));
```

#### applications（応募）
```sql
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT CHECK (char_length(message) <= 500),
  status application_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同じ投稿に重複応募を防ぐ
  UNIQUE(post_id, applicant_id)
);

-- インデックス
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

-- インデックス
CREATE INDEX idx_matches_application_id ON matches(application_id);
CREATE INDEX idx_matches_status ON matches(status);
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
  
  -- 同じマッチに対して1人1レビュー
  UNIQUE(match_id, reviewer_id)
);

-- インデックス
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

-- インデックス
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

-- applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿者と応募者は応募を閲覧可能" ON applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() = (SELECT user_id FROM posts WHERE id = post_id)
  );

CREATE POLICY "認証ユーザーは応募可能" ON applications
  FOR INSERT WITH CHECK (
    auth.uid() = applicant_id AND
    auth.uid() != (SELECT user_id FROM posts WHERE id = post_id)
  );

CREATE POLICY "応募者は自分の応募をキャンセル可能" ON applications
  FOR UPDATE USING (auth.uid() = applicant_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の通知のみ閲覧可能" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分の通知のみ更新可能" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3.4 Database Functions & Triggers

```sql
-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 新規ユーザー登録時にプロフィール自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 応募承認時にマッチング自動作成
CREATE OR REPLACE FUNCTION handle_application_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO matches (application_id)
    VALUES (NEW.id);
    
    -- 通知作成
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.applicant_id,
      'application_accepted',
      '応募が承認されました！',
      '投稿者があなたの応募を承認しました。',
      '/matches/' || (SELECT id FROM matches WHERE application_id = NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_accepted
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_application_accepted();

-- 閲覧数カウント関数
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. ディレクトリ構成

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証グループ
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (main)/                   # メインレイアウトグループ
│   │   ├── page.tsx              # ホーム
│   │   ├── explore/page.tsx      # 探索
│   │   ├── posts/
│   │   │   ├── page.tsx          # 投稿一覧
│   │   │   ├── new/page.tsx      # 新規投稿
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # 投稿詳細
│   │   │       └── edit/page.tsx # 編集
│   │   ├── profile/
│   │   │   ├── page.tsx          # 自分のプロフィール
│   │   │   ├── edit/page.tsx     # 編集
│   │   │   └── [username]/page.tsx # 他ユーザー
│   │   ├── applications/page.tsx # 応募管理
│   │   ├── matches/
│   │   │   ├── page.tsx          # マッチ一覧
│   │   │   └── [id]/page.tsx     # マッチ詳細
│   │   ├── notifications/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   └── posts/
│   │       └── [id]/
│   │           └── view/route.ts
│   ├── layout.tsx                # ルートレイアウト
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── components/
│   ├── ui/                       # shadcn/uiベース
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── nav-links.tsx
│   ├── posts/
│   │   ├── post-card.tsx
│   │   ├── post-card-skeleton.tsx
│   │   ├── post-list.tsx
│   │   ├── post-form.tsx
│   │   ├── post-detail.tsx
│   │   ├── post-filters.tsx
│   │   └── post-type-badge.tsx
│   ├── profile/
│   │   ├── profile-card.tsx
│   │   ├── profile-form.tsx
│   │   ├── avatar-upload.tsx
│   │   └── stats-card.tsx
│   ├── applications/
│   │   ├── application-card.tsx
│   │   ├── application-list.tsx
│   │   └── application-form.tsx
│   ├── matches/
│   │   ├── match-card.tsx
│   │   └── match-list.tsx
│   ├── notifications/
│   │   ├── notification-item.tsx
│   │   ├── notification-list.tsx
│   │   └── notification-bell.tsx
│   └── common/
│       ├── category-badge.tsx
│       ├── rating-stars.tsx
│       ├── empty-state.tsx
│       ├── loading-spinner.tsx
│       └── error-boundary.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # ブラウザ用クライアント
│   │   ├── server.ts             # サーバー用クライアント
│   │   ├── middleware.ts         # Auth middleware
│   │   └── admin.ts              # Service role クライアント
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── post.ts
│   │   ├── profile.ts
│   │   └── application.ts
│   ├── utils/
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── date.ts               # 日付フォーマット
│   │   ├── string.ts             # 文字列操作
│   │   └── errors.ts             # エラーハンドリング
│   └── constants/
│       ├── routes.ts
│       ├── categories.ts
│       └── config.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-posts.ts
│   ├── use-profile.ts
│   ├── use-applications.ts
│   ├── use-notifications.ts
│   ├── use-debounce.ts
│   └── use-infinite-scroll.ts
│
├── stores/
│   ├── auth-store.ts
│   ├── notification-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── database.ts               # Supabase自動生成型
│   ├── api.ts
│   └── index.ts
│
└── styles/
    └── globals.css
```

---

## 5. 機能一覧と優先度

### Phase 1: MVP（必須機能）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 認証 | メール・Google・GitHub | P0 |
| プロフィール | 作成・編集・表示 | P0 |
| 投稿作成 | teach/learn投稿 | P0 |
| 投稿一覧 | フィルター・検索 | P0 |
| 投稿詳細 | 詳細表示・応募 | P0 |
| 応募機能 | 応募・承認・拒否 | P0 |

### Phase 2: 成長機能
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 通知 | リアルタイム通知 | P1 |
| マッチング管理 | 進捗管理・完了 | P1 |
| レビュー | 評価・コメント | P1 |
| 検索強化 | 全文検索・タグ | P1 |

### Phase 3: 差別化機能
| 機能 | 説明 | 優先度 |
|------|------|--------|
| チャット | マッチ後のDM | P2 |
| カレンダー連携 | 予定調整 | P2 |
| バッジ・ランク | ゲーミフィケーション | P2 |
| おすすめ | レコメンド機能 | P2 |

---

## 6. UI/UXデザイン方針

### 6.1 デザインコンセプト
**「Clean + Warm + Playful」**

- **Clean**: 余白を活かしたミニマルなレイアウト
- **Warm**: 優しい色調とやわらかなシャドウ
- **Playful**: 程よいアニメーションとアイコン

### 6.2 カラーパレット

```css
:root {
  /* Primary - 温かみのあるオレンジ */
  --primary-50: #fff7ed;
  --primary-100: #ffedd5;
  --primary-200: #fed7aa;
  --primary-300: #fdba74;
  --primary-400: #fb923c;
  --primary-500: #f97316;  /* メインカラー */
  --primary-600: #ea580c;
  --primary-700: #c2410c;
  
  /* Secondary - 落ち着いたティール */
  --secondary-500: #14b8a6;
  
  /* Neutral - グレースケール */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;
  
  /* Semantic */
  --success: #22c55e;
  --warning: #eab308;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Post Types */
  --teach-color: #8b5cf6;  /* Purple */
  --learn-color: #06b6d4;  /* Cyan */
}
```

### 6.3 タイポグラフィ

```css
/* フォント */
--font-sans: 'Noto Sans JP', 'Inter', sans-serif;
--font-display: 'Outfit', 'Noto Sans JP', sans-serif;

/* サイズ */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 6.4 コンポーネントスタイル

**カード**
```css
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}
.card:hover {
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}
```

**ボタン**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}
```

### 6.5 レスポンシブブレークポイント

```css
/* Mobile First */
sm: 640px   /* スマホ横向き */
md: 768px   /* タブレット */
lg: 1024px  /* デスクトップ */
xl: 1280px  /* 大画面 */
```

---

## 7. 認証フロー

### 7.1 サポートする認証方式
1. **メール/パスワード**: 基本認証
2. **Google OAuth**: ワンクリック登録
3. **GitHub OAuth**: 開発者向け（オプション）

### 7.2 フロー図

```
[ランディング] → [ログイン/登録]
                      ↓
              [OAuth or Email]
                      ↓
              [プロフィール設定]
                      ↓
                  [ホーム]
```

### 7.3 セキュリティ要件
- パスワード最低8文字、英数字必須
- メール確認必須
- セッション有効期限: 7日
- リフレッシュトークン: 30日

---

## 8. API設計

### 8.1 エンドポイント一覧（Supabase RPC + REST）

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/posts | 投稿一覧取得 |
| POST | /api/posts | 投稿作成 |
| GET | /api/posts/:id | 投稿詳細取得 |
| PATCH | /api/posts/:id | 投稿更新 |
| DELETE | /api/posts/:id | 投稿削除 |
| POST | /api/posts/:id/view | 閲覧数カウント |
| POST | /api/applications | 応募作成 |
| PATCH | /api/applications/:id | 応募ステータス更新 |
| GET | /api/notifications | 通知一覧取得 |
| PATCH | /api/notifications/read-all | 全既読 |

### 8.2 レスポンス形式

```typescript
// 成功レスポンス
{
  success: true,
  data: T,
  meta?: {
    total: number,
    page: number,
    limit: number
  }
}

// エラーレスポンス
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

## 9. 状態管理設計

### 9.1 Zustand Store構成

```typescript
// auth-store.ts
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
}

// notification-store.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

// ui-store.ts
interface UIState {
  isSidebarOpen: boolean;
  isMobileNavOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
}
```

---

## 10. テスト戦略

### 10.1 テストピラミッド
- **Unit Tests (70%)**: ユーティリティ、バリデーション
- **Integration Tests (20%)**: API、DB操作
- **E2E Tests (10%)**: 主要ユーザーフロー

### 10.2 テスト対象
```
✅ バリデーションロジック
✅ カスタムフック
✅ API レスポンス
✅ 認証フロー
✅ 投稿CRUD
✅ 応募フロー
```

---

## 11. パフォーマンス最適化

### 11.1 Next.js最適化
- **ISR**: 投稿一覧・詳細ページ
- **動的インポート**: 重いコンポーネント
- **Image最適化**: next/image使用

### 11.2 Supabase最適化
- **インデックス**: 検索・フィルター用
- **ページネーション**: cursor-based
- **Realtime**: 必要な箇所のみ

### 11.3 フロントエンド最適化
- **Skeleton UI**: ローディング体験向上
- **Optimistic Updates**: 即座のUI反映
- **無限スクロール**: 大量データ対応

---

## 12. デプロイ・運用

### 12.1 環境構成
```
Development → Staging → Production
```

### 12.2 環境変数
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXT_PUBLIC_SITE_URL=

# Analytics (将来)
NEXT_PUBLIC_GA_ID=
```

### 12.3 モニタリング（将来）
- Vercel Analytics
- Sentry (エラー監視)
- Supabase Dashboard

---

## 13. 開発フェーズ詳細

### Phase 1: 基盤（今回）
- [x] 技術設計書作成
- [ ] プロジェクトセットアップ
- [ ] DB設計・マイグレーション
- [ ] 認証実装
- [ ] 基本UI（shadcn/ui）

### Phase 2: コア機能
- [ ] プロフィール機能
- [ ] 投稿CRUD
- [ ] 投稿一覧・検索
- [ ] 投稿詳細

### Phase 3: マッチング
- [ ] 応募機能
- [ ] 応募管理
- [ ] マッチング成立

### Phase 4: 完成度向上
- [ ] 通知機能
- [ ] レビュー機能
- [ ] UIブラッシュアップ
- [ ] テスト追加

---

以上が YatteMi! の完全技術設計書です。
