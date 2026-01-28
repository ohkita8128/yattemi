# YatteMi! 完全引き継ぎ資料

**最終更新**: 2026年1月25日  
**バージョン**: Phase 6 完了

---

## 📋 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [ディレクトリ構造](#3-ディレクトリ構造)
4. [データベース設計](#4-データベース設計)
5. [主要機能と実装](#5-主要機能と実装)
6. [Supabaseトリガー一覧](#6-supabaseトリガー一覧)
7. [認証・セキュリティ](#7-認証セキュリティ)
8. [既知の問題と対策](#8-既知の問題と対策)
9. [開発フロー](#9-開発フロー)
10. [残タスクと発展案](#10-残タスクと発展案)
11. [次回チャット用テンプレート](#11-次回チャット用テンプレート)

---

## 1. プロジェクト概要

### 1.1 サービスコンセプト

**YatteMi!** は大学生向けスキルシェアリングプラットフォーム。

「教えたい人（サポーター）」と「学びたい人（チャレンジャー）」をマッチングし、スキルの相互学習を促進する。

### 1.2 投稿タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| **support**（サポートしたい） | スキルを教えたい人が投稿 | 「プログラミング教えます」 |
| **challenge**（チャレンジしたい） | スキルを学びたい人が投稿 | 「料理を教えてほしい」 |

### 1.3 基本情報

| 項目 | 値 |
|------|-----|
| 本番URL | https://yattemi.vercel.app |
| GitHub | プライベートリポジトリ |
| ローカルパス | `C:\Users\PC_User\Documents\GitHub\yattemi` |
| 連絡先 | yattemi.official@gmail.com |

---

## 2. 技術スタック

### 2.1 フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14 (App Router) | フレームワーク |
| TypeScript | 5.x | 型安全 |
| Tailwind CSS | 3.x | スタイリング |
| shadcn/ui | - | UIコンポーネント |
| Lucide React | - | アイコン |
| browser-image-compression | - | 画像圧縮 |
| sonner | - | トースト通知 |

### 2.2 バックエンド

| 技術 | 用途 |
|------|------|
| Supabase | PostgreSQL DB + 認証 + ストレージ |
| Supabase RLS | 行レベルセキュリティ |
| Database Functions | SECURITY DEFINER付き関数 |
| Database Triggers | 自動処理（通知等） |

### 2.3 インフラ

| 技術 | 用途 |
|------|------|
| Vercel | ホスティング・CI/CD |
| Supabase Storage | 画像保存 |

---

## 3. ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/               # 認証関連ページ
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── (main)/               # メインコンテンツ
│   │   ├── about/            # サービス紹介
│   │   ├── applications/     # 応募管理
│   │   ├── challenges/       # （旧ルート、未使用？）
│   │   ├── contact/          # お問い合わせ
│   │   ├── dashboard/        # ダッシュボード
│   │   ├── explore/          # 投稿一覧（メイン）
│   │   ├── matches/          # マッチング・メッセージ
│   │   │   └── [id]/         # 個別チャット
│   │   ├── notifications/    # 通知一覧
│   │   ├── onboarding/       # 初回設定
│   │   ├── posts/            # 投稿関連
│   │   │   ├── new/          # 新規投稿
│   │   │   └── [id]/         # 投稿詳細・編集
│   │   ├── privacy/          # プライバシーポリシー
│   │   ├── profile/          # 自分のプロフィール編集
│   │   ├── settings/         # 設定
│   │   │   └── notifications/ # 通知設定
│   │   ├── support/          # （旧ルート、未使用？）
│   │   ├── terms/            # 利用規約
│   │   └── users/            # 他ユーザープロフィール
│   │       └── [username]/
│   └── layout.tsx
├── components/
│   ├── applications/         # 応募関連
│   │   ├── application-card.tsx
│   │   ├── application-dialog.tsx
│   │   └── index.ts
│   ├── common/               # 共通コンポーネント
│   ├── layout/               # レイアウト（ヘッダー等）
│   ├── posts/                # 投稿関連
│   │   ├── post-card.tsx     # 投稿カード
│   │   ├── post-form.tsx     # 投稿フォーム
│   │   └── post-questions.tsx # 公開質問
│   ├── profile/              # プロフィール関連
│   │   └── profile-image-gallery.tsx
│   ├── reviews/              # レビュー関連
│   ├── session/              # セッション・チャット
│   │   └── session-chat.tsx  # チャットコンポーネント
│   ├── ui/                   # shadcn/ui コンポーネント
│   └── users/                # ユーザー関連
├── hooks/
│   ├── use-applications.ts   # 応募CRUD
│   ├── use-auth.ts           # 認証（直接fetch使用）
│   ├── use-avatar.ts         # アバター
│   ├── use-challenges.ts     # チャレンジ
│   ├── use-debounce.ts       # デバウンス
│   ├── use-follow.ts         # フォロー
│   ├── use-likes.ts          # いいね
│   ├── use-messages.ts       # メッセージ
│   ├── use-post-questions.ts # 公開質問
│   ├── use-posts.ts          # 投稿取得
│   └── use-reviews.ts        # レビュー
├── lib/
│   ├── image-compression.ts  # 画像圧縮
│   ├── supabase/
│   │   └── client.ts         # Supabaseクライアント
│   └── utils.ts              # ユーティリティ
├── stores/
│   └── notification-store.ts # 通知状態管理
└── types/
    ├── database.ts           # DB型定義
    ├── post-question.ts      # 質問型
    └── index.ts
```

---

## 4. データベース設計

### 4.1 テーブル一覧

```
profiles          - ユーザープロフィール
posts             - 投稿（likes_count, questions_count キャッシュあり）
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
post_questions    - 公開質問
```

### 4.2 主要テーブル詳細

#### profiles
```sql
id              uuid PK (auth.users.id)
username        text UNIQUE
display_name    text
avatar_url      text
bio             text
university      text
department      text
grade           int
twitter_url     text
instagram_url   text
website_url     text
is_verified     boolean
is_public       boolean
created_at      timestamptz
updated_at      timestamptz
```

#### posts
```sql
id              uuid PK
user_id         uuid FK → profiles
title           text
description     text
type            enum ('support', 'challenge')
status          enum ('open', 'closed', 'completed', 'cancelled')
category_id     int FK → categories
location_type   text ('online', 'offline', 'hybrid')
max_participants int
deadline        timestamptz
images          text[] (最大5枚)
likes_count     int (キャッシュ)
questions_count int (キャッシュ)
created_at      timestamptz
updated_at      timestamptz
```

#### post_questions
```sql
id              uuid PK
post_id         uuid FK → posts
user_id         uuid FK → profiles (質問者)
question_text   text (最大400文字)
answer_text     text (回答)
answered_at     timestamptz
created_at      timestamptz
deleted_at      timestamptz (論理削除)
```

#### notifications
```sql
id              uuid PK
user_id         uuid FK → profiles
type            enum (下記参照)
title           text
message         text
data            jsonb (リンク用データ)
is_read         boolean
created_at      timestamptz
```

**NotificationType一覧:**
- `new_application` - 新規応募
- `application_accepted` - 応募承認
- `application_rejected` - 応募却下
- `new_like` - いいね
- `new_follower` - フォロー
- `new_message` - メッセージ
- `new_question` - 質問
- `question_answered` - 質問回答
- `new_review` - レビュー
- `match_completed` - マッチ完了
- `system` - システム通知

### 4.3 カテゴリ一覧（17種類）

| ID | 名前 |
|----|------|
| 1 | プログラミング |
| 2 | デザイン |
| 3 | 語学 |
| 4 | 音楽 |
| 5 | 料理 |
| 6 | スポーツ |
| 7 | 写真・映像 |
| 8 | ビジネス |
| 9 | 学問 |
| 10 | ハンドメイド |
| 11 | 美容・ファッション |
| 12 | ゲーム |
| 13 | 旅行 |
| 14 | ライフスタイル |
| 15 | その他 |
| 16 | AI・機械学習 |
| 17 | 資格・キャリア |

---

## 5. 主要機能と実装

### 5.1 認証フロー

```
1. サインアップ → Supabase Auth → メール認証
2. ログイン → セッション取得 → プロフィール確認
3. 初回ログイン → /onboarding でプロフィール設定
4. 以降 → /explore がホーム
```

**重要**: `use-auth.ts` はSupabaseクライアントのフリーズ問題があるため、直接fetchを使用。

### 5.2 投稿フロー

```
1. /posts/new で投稿作成
2. 画像は browser-image-compression で圧縮（最大1MB、1920px）
3. Supabase Storage にアップロード
4. posts テーブルに INSERT
```

### 5.3 応募〜マッチングフロー

```
1. 投稿詳細から「応募する」
2. applications テーブルに INSERT
3. 投稿者に通知（notify_on_application トリガー）
4. 投稿者が承認 → matches テーブルに INSERT
5. 応募者に通知（notify_on_application_status_change トリガー）
6. /matches/[id] でメッセージ可能に
```

### 5.4 公開質問機能

```
1. 投稿詳細ページで質問投稿（認証ユーザーのみ）
2. 投稿者に通知（notify_on_question トリガー）
3. 投稿者が回答
4. 質問者に通知（notify_on_question_answer トリガー）
```

**削除ルール:**
- 質問者: 投稿後10分以内のみ
- 投稿者: いつでも可能
- 実装: `delete_post_question` Database Function

### 5.5 通知システム

**通知作成（Supabaseトリガー）:**

| トリガー名 | イベント | 通知タイプ |
|-----------|---------|-----------|
| notify_on_application | 応募INSERT | new_application |
| notify_on_application_status_change | 応募UPDATE | application_accepted/rejected |
| notify_on_like | いいねINSERT | new_like |
| notify_on_follow | フォローINSERT | new_follower |
| notify_on_message | メッセージINSERT | new_message |
| notify_on_question | 質問INSERT | new_question |
| notify_on_question_answer | 質問UPDATE(回答) | question_answered |
| notify_on_review | レビューINSERT | new_review |

**通知リンク（フロント側で動的生成）:**

```typescript
// src/app/(main)/notifications/page.tsx
const getLink = (notification) => {
  const data = notification.data;
  switch (notification.type) {
    case 'new_like':
    case 'new_question':
    case 'question_answered':
      return `/posts/${data.post_id}`;
    case 'new_follower':
      return data.username ? `/users/${data.username}` : null;
    case 'new_application':
      return '/dashboard?tab=received';
    case 'application_accepted':
    case 'application_rejected':
      return '/dashboard?tab=sent';
    case 'new_message':
      return data.match_id ? `/messages/${data.match_id}` : '/messages';
    case 'new_review':
      return '/dashboard?tab=reviews';
  }
};
```

### 5.6 いいね・質問数キャッシュ

`posts` テーブルに `likes_count`, `questions_count` カラムを追加。

**トリガーで自動更新:**
- `update_likes_count` - いいねINSERT/DELETEで更新
- `update_questions_count` - 質問INSERT/UPDATE/DELETEで更新

---

## 6. Supabaseトリガー一覧

### 6.1 通知系

| 関数名 | トリガー対象 | 説明 |
|--------|-------------|------|
| notify_on_application | applications INSERT | 応募通知 |
| notify_on_application_status_change | applications UPDATE | 承認/却下通知 |
| notify_on_like | likes INSERT | いいね通知 |
| notify_on_follow | follows INSERT | フォロー通知（username含む） |
| notify_on_message | messages INSERT | メッセージ通知 |
| notify_on_question | post_questions INSERT | 質問通知 |
| notify_on_question_answer | post_questions UPDATE | 回答通知 |
| notify_on_review | reviews INSERT | レビュー通知 |

### 6.2 カウントキャッシュ系

| 関数名 | トリガー対象 | 説明 |
|--------|-------------|------|
| update_likes_count | likes INSERT/DELETE | posts.likes_count更新 |
| update_questions_count | post_questions INSERT/UPDATE/DELETE | posts.questions_count更新 |

---

## 7. 認証・セキュリティ

### 7.1 Row Level Security (RLS)

主要なポリシー:

```sql
-- profiles: 誰でも閲覧可、本人のみ更新
-- posts: 誰でも閲覧可、本人のみ更新/削除
-- applications: 関係者のみ閲覧/更新
-- messages: マッチ参加者のみ
-- notifications: 本人のみ
```

### 7.2 Database Functions (SECURITY DEFINER)

RLSを回避して権限チェック付きで実行:

```sql
-- 質問削除
delete_post_question(question_id uuid)

-- 使用例
const { error } = await supabase.rpc('delete_post_question', {
  question_id: id
});
```

---

## 8. 既知の問題と対策

### 8.1 Supabaseクライアントのフリーズ

**症状**: `supabase.from('profiles').select()` が応答しない

**対策**: `use-auth.ts` で直接 `fetch()` を使用

```typescript
// ❌ フリーズすることがある
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

// ✅ 確実に動く
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
  {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

### 8.2 RLSでUPDATE 403エラー

**症状**: ポリシーが正しくても `PATCH` リクエストが403

**対策**: `SECURITY DEFINER` 付きのDatabase Functionを使用

### 8.3 Supabase型エラー

**症状**: `from('post_questions')` で型エラー

**対策**: `(supabase as any).from('post_questions')` でキャスト

### 8.4 PowerShellの文字化け

**症状**: ファイル操作で日本語が化ける

**対策**: 
```powershell
# PowerShell 7で実行
pwsh
# UTF-8 BOMなし指定
Get-Content -Encoding utf8NoBOM
Set-Content -Encoding utf8NoBOM
```

---

## 9. 開発フロー

### 9.1 基本コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド確認
npm run build

# デプロイ（Vercel自動）
git add -A
git commit -m "メッセージ"
git push

# キャッシュクリア
Remove-Item -Recurse -Force .next
npm run dev
```

### 9.2 PowerShellでのファイル編集

```powershell
# ファイル内容取得
$content = Get-Content "ファイルパス" -Raw -Encoding utf8NoBOM

# 置換
$content = $content -replace [regex]::Escape($old), $new

# 保存
Set-Content "ファイルパス" -Value $content -NoNewline -Encoding utf8NoBOM

# 特定行の取得（0始まり）
(Get-Content "ファイルパス" -Encoding utf8NoBOM)[10..20]

# 検索
Select-String -Path "src\**\*.tsx" -Pattern "検索語" 
Get-ChildItem -Recurse -Include "*.tsx" | Select-String -Pattern "検索語"
```

### 9.3 Supabase SQL実行

Supabase管理画面 → SQL Editor で実行

---

## 10. 残タスクと発展案

### 10.1 優先度高（バグ・UX改善）

| タスク | 詳細 | 状態 |
|--------|------|------|
| IntersectionObserver修正 | 無限スクロールが動かない | 調査中断 |
| マッチング後の導線整理 | フローがわかりにくい | 未着手 |

### 10.2 優先度中（機能追加）

| タスク | 詳細 | 実装案 |
|--------|------|--------|
| 質問の通報機能 | 不適切な質問を報告 | question_reportsテーブル追加 |
| レビュー催促通知 | マッチ完了後N日で自動通知 | pg_cron or Vercel Cron |
| 応募放置通知 | 長期間未処理の応募を通知 | 同上 |
| 古い通知の自動削除 | 30日以上経過で削除 | pg_cronで定期実行 |

### 10.3 優先度低（発展）

| タスク | 詳細 |
|--------|------|
| 質問へのいいね機能 | 良い質問を評価 |
| 通知のプッシュ通知 | Firebase Cloud Messaging連携 |
| Supabase型自動生成 | `supabase gen types typescript` |
| テスト追加 | Jest / Playwright |
| ダークモード対応 | Tailwind dark: |
| PWA対応 | オフライン対応 |
| 検索機能強化 | 全文検索（pg_trgm） |

### 10.4 調査が必要

| 項目 | 詳細 |
|------|------|
| /challenges, /support ルート | 使われてる？削除可能？ |
| use-challenges.ts | 何に使ってる？ |

---

## 11. 次回チャット用テンプレート

```
YatteMi! 開発の続き

## 概要
大学生向けスキルシェアプラットフォーム
教えたい人（サポート）と学びたい人（チャレンジ）のマッチング

## 技術スタック
Next.js 14 + TypeScript + Tailwind + Supabase + Vercel

## ローカルパス
C:\Users\PC_User\Documents\GitHub\yattemi

## 前回完了（Phase 6）
- 通知機能拡張（質問・回答・レビュー通知トリガー追加）
- 通知リンク動的生成（data JSONからリンク生成）
- 通知UIコンパクト化
- DM送信ボタン視認性改善
- 応募者カードからプロフィールリンク追加
- likes_count/questions_count キャッシュ実装

## 残タスク
1. IntersectionObserver修正（無限スクロール）
2. マッチング後の導線整理
3. 質問の通報機能
4. レビュー催促通知
5. /challenges, /support ルートの調査

## 主要ファイル
- 投稿一覧: src/app/(main)/explore/page.tsx
- 投稿詳細: src/app/(main)/posts/[id]/page.tsx
- 通知一覧: src/app/(main)/notifications/page.tsx
- 認証フック: src/hooks/use-auth.ts（直接fetch使用）
- 投稿フック: src/hooks/use-posts.ts

## Supabaseトリガー
通知系: notify_on_application, notify_on_like, notify_on_follow, 
       notify_on_message, notify_on_question, notify_on_question_answer, notify_on_review
キャッシュ系: update_likes_count, update_questions_count

## 既知の問題
- Supabaseクライアントがフリーズすることがある → 直接fetch使用
- RLSでUPDATE 403エラー → Database Function使用
- Supabase型エラー → (supabase as any) でキャスト
- PowerShell文字化け → pwsh + utf8NoBOM指定

## 本番URL
https://yattemi.vercel.app

## 引き継ぎ資料
/mnt/user-data/uploads/YATTEMI_HANDOVER_v5.md
```

---

## 環境変数

`.env.local` に必要:
```
NEXT_PUBLIC_SUPABASE_URL=https://bojkczhgfhxazuiomktv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

---

## Supabaseトリガー作成SQL（参考）

### 質問通知

```sql
CREATE OR REPLACE FUNCTION notify_on_question()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  questioner_name text;
  post_title text;
BEGIN
  SELECT user_id, title INTO post_owner_id, post_title
  FROM posts WHERE id = NEW.post_id;
  
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  SELECT display_name INTO questioner_name
  FROM profiles WHERE id = NEW.user_id;
  
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    post_owner_id, 'new_question', '新しい質問',
    questioner_name || 'さんが「' || LEFT(post_title, 20) || '」に質問しました',
    jsonb_build_object('post_id', NEW.post_id, 'question_id', NEW.id, 'user_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### フォロー通知（username含む）

```sql
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
  follower_username text;
BEGIN
  SELECT display_name, username INTO follower_name, follower_username
  FROM profiles WHERE id = NEW.follower_id;
  
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id, 'new_follower', '新しいフォロワー',
    follower_name || 'さんがあなたをフォローしました',
    jsonb_build_object('user_id', NEW.follower_id, 'username', follower_username)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

*この資料は開発の引き継ぎ用です。*  
*最終更新: 2026年1月25日*
