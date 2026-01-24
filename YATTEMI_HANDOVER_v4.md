# YatteMi! 引き継ぎ資料

**最終更新**: 2026年1月24日  
**バージョン**: Phase 5 完了

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

## 2. 今回のセッションで実装したもの（Phase 5）

### 2.1 公開質問機能

マッチング前の不安解消・投稿内容の理解促進のため、投稿に対して公開で質問できる機能を実装。

| 項目 | 内容 |
|------|------|
| DBテーブル | `post_questions` 新規作成 |
| 質問投稿 | 認証ユーザーのみ |
| 回答 | 投稿者のみ |
| 表示 | 全ユーザーに公開 |
| 質問者表示 | ユーザー名表示（匿名ではない） |
| 文字数制限 | 最大400文字 |

### 2.2 質問機能の詳細

**質問投稿**
- 認証ユーザーのみ投稿可能
- 締め切り後は新規質問不可
- 1投稿に複数質問OK

**回答**
- 投稿者のみ回答可能
- 回答は編集可能
- 1質問につき1回答

**削除**
- 質問者：投稿後10分以内のみ削除可能
- 投稿者：いつでも削除可能
- 論理削除（`deleted_at`）

### 2.3 ポストカードへの質問数表示

`PostCard` コンポーネントに質問数を表示。いいねボタンの横に `MessageCircle` アイコンと件数を表示。

### 2.4 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/types/database.ts` | `PostQuestion` 型定義追加 |
| `src/types/post-question.ts` | 質問の型定義（JOINあり） |
| `src/hooks/use-post-questions.ts` | 質問CRUD操作フック |
| `src/components/posts/post-questions.tsx` | 質問一覧・投稿UI |
| `src/components/posts/post-card.tsx` | 質問数表示追加 |
| `src/hooks/use-posts.ts` | クエリに `post_questions` 追加 |

---

## 3. データベース構造（更新）

### 3.1 主要テーブル
```
profiles          - ユーザープロフィール
posts             - 投稿（images カラム追加済み）
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
post_questions    - 公開質問（NEW）
```

### 3.2 post_questions テーブル（NEW）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| post_id | uuid FK | 投稿ID |
| user_id | uuid FK | 質問者ID |
| question_text | text | 質問内容（最大400文字） |
| answer_text | text NULL | 回答内容 |
| answered_at | timestamptz NULL | 回答日時 |
| created_at | timestamptz | 作成日時 |
| deleted_at | timestamptz NULL | 論理削除日時 |

### 3.3 RLSポリシー（post_questions）

| ポリシー名 | 操作 | 条件 |
|------------|------|------|
| Anyone can view questions | SELECT | `deleted_at IS NULL` |
| Authenticated users can insert questions | INSERT | `auth.uid() = user_id` |
| update_questions_public | UPDATE | `true`（Function側で制御） |

### 3.4 Database Function

削除処理はRLSの問題があったため、`SECURITY DEFINER` 付きのFunctionで実装：

```sql
CREATE OR REPLACE FUNCTION delete_post_question(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_user_id uuid;
  v_post_owner_id uuid;
  v_created_at timestamptz;
BEGIN
  -- 質問の情報を取得
  SELECT pq.user_id, pq.created_at, p.user_id
  INTO v_question_user_id, v_created_at, v_post_owner_id
  FROM post_questions pq
  JOIN posts p ON p.id = pq.post_id
  WHERE pq.id = question_id;

  -- 権限チェック
  IF auth.uid() = v_post_owner_id THEN
    -- 投稿者は常に削除可能
    UPDATE post_questions SET deleted_at = now() WHERE id = question_id;
  ELSIF auth.uid() = v_question_user_id AND v_created_at > now() - interval '10 minutes' THEN
    -- 質問者は10分以内なら削除可能
    UPDATE post_questions SET deleted_at = now() WHERE id = question_id;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;
END;
$$;
```

---

## 4. ファイル構成（主要・更新）

```
src/
├── app/(main)/
│   ├── explore/page.tsx       # 投稿一覧（無限スクロール）
│   ├── posts/
│   │   ├── new/page.tsx       # 新規投稿（PostForm使用）
│   │   └── [id]/
│   │       ├── page.tsx       # 投稿詳細（質問セクション追加）
│   │       └── edit/page.tsx  # 投稿編集
│   ├── profile/edit/page.tsx  # プロフィール編集
│   ├── onboarding/page.tsx    # 初回設定
│   └── users/[username]/page.tsx # ユーザープロフィール
├── components/
│   ├── posts/
│   │   ├── post-card.tsx      # 投稿カード（質問数表示追加）
│   │   ├── post-form.tsx      # 投稿フォーム（共通）
│   │   └── post-questions.tsx # 公開質問コンポーネント（NEW）
│   └── profile/
│       └── profile-image-gallery.tsx # ギャラリー
├── hooks/
│   ├── use-posts.ts           # 投稿取得（post_questions JOIN追加）
│   ├── use-post-questions.ts  # 質問CRUD（NEW）
│   ├── use-auth.ts            # 認証（直接fetch使用）
│   └── useProfileImages.ts    # ギャラリー画像管理
├── types/
│   ├── database.ts            # DB型定義（PostQuestion追加）
│   └── post-question.ts       # 質問型定義（NEW）
└── lib/
    ├── image-compression.ts   # 画像圧縮ユーティリティ
    └── supabase/
        └── client.ts          # Supabaseクライアント
```

---

## 5. 既知の問題と対策

### 5.1 Supabaseクライアントのフリーズ問題

**症状**: `supabase.from('profiles').select()` が応答しない

**原因**: 不明（Supabaseクライアントの内部処理）

**対策**: `use-auth.ts` では直接 `fetch()` を使用
```typescript
// ❌ フリーズする
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

// ✅ 動く
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
  {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
);
```

### 5.2 RLSでUPDATEが403エラー

**症状**: ポリシーが正しくても `PATCH` リクエストが403

**対策**: `SECURITY DEFINER` 付きのDatabase Functionを使用

### 5.3 型エラー（Supabase）

**症状**: `from('post_questions')` で型エラー

**対策**: `(supabase.from('post_questions') as any)` でキャスト

---

## 6. よくあるエラーと対策

### 6.1 ビルドエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `'X' is declared but never read` | 未使用のimport | 該当importを削除 |
| `Type 'undefined' is not assignable` | null/undefinedチェック不足 | `|| null` や `?? default` を追加 |
| `Unexpected token` | 構文エラー（カッコ閉じ忘れ等） | カッコの対応を確認 |
| `この呼び出しに一致するオーバーロードはありません` | Supabase型定義不足 | `as any` でキャスト |

### 6.2 ランタイムエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| 403 Forbidden | RLS問題 | Database Function使用 or ポリシー確認 |
| No API key found | 環境変数未設定 | `.env.local` 確認 |
| 画面に表示されない | コンポーネント配置ミス | DevToolsで要素確認 |

---

## 7. 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド確認
npm run build

# デプロイ（自動）
git add .
git commit -m "コミットメッセージ"
git push origin main

# キャッシュクリア
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 8. 残タスク・今後の展開

### 8.1 優先度高

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| マッチング後の導線整理 | 現状フローがぐちゃぐちゃ | 高 |
| メッセージ機能改善 | リアルタイム通知など | 中 |
| 質問の通報機能 | 後回しにしたもの | 低 |

### 8.2 優先度中

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| teach/challenges の用途整理 | 現状何に使われてるか不明 | 調査 |
| likes_count キャッシュ | posts に likes_count カラム追加 | 低 |
| 古い通知の自動削除 | pg_cron で定期実行 | 低 |
| IntersectionObserver修正 | 手動ボタンなしで動くように | 中 |
| 質問へのいいね機能 | 将来追加可能 | 低 |

### 8.3 優先度低

| タスク | 詳細 | 難易度 |
|--------|------|--------|
| 通知の種類別フィルター | UIに追加 | 低 |
| 通知の複数選択削除 | UIに追加 | 低 |
| Supabase型生成 | `as any` 撲滅 | 中 |
| テスト追加 | Jest / Playwright | 高 |
| delete_post_question にセキュリティ強化 | 権限チェック追加済み | 完了 |

---

## 9. 次回チャットの開始テンプレート

```
YatteMi! 開発の続き

■ 前回完了（Phase 5）
- 公開質問機能（質問投稿、回答、編集、削除）
- ポストカードに質問数表示
- 削除はDatabase Function（SECURITY DEFINER）で実装

■ 残タスク
1. マッチング後の導線整理（優先度高）
2. メッセージ機能改善
3. 質問の通報機能（後回し）
4. teach/challenges の用途整理

■ 技術スタック
Next.js 14 + TypeScript + Tailwind + Supabase + Vercel

■ ローカルパス
C:\Users\PC_User\Documents\GitHub\yattemi

■ 主要ファイル
- 投稿詳細: src/app/(main)/posts/[id]/page.tsx
- 質問コンポーネント: src/components/posts/post-questions.tsx
- 質問フック: src/hooks/use-post-questions.ts
- 認証フック: src/hooks/use-auth.ts（直接fetch使用）

■ 既知の問題
- Supabaseクライアントがフリーズすることがある → 直接fetch使用
- RLSでUPDATE 403エラー → Database Function使用
```

---

## 10. 環境変数

`.env.local` に必要：
```
NEXT_PUBLIC_SUPABASE_URL=https://bojkczhgfhxazuiomktv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

---

## 11. 公開質問機能の仕様まとめ

### 目的
- マッチ前の不安解消
- 投稿内容の理解促進
- 投稿の価値可視化（Q&A資産化）

### 基本ルール
- すべての質問・回答は全ユーザーに公開
- ログインユーザーのみ投稿可能
- 未ログインユーザーは閲覧のみ
- 非公開質問なし
- 画像添付なし
- スレッド分岐なし

### 期限
- 投稿の締切まで質問・回答可能
- 締切後は閲覧のみ

### UI上の注意文
```
※すべての質問・回答は公開されます
※個人情報・連絡先の投稿は禁止です
```

---

*この資料は開発の引き継ぎ用です。*
*最終更新: 2026年1月24日*
