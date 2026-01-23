# YatteMi! 開発引継ぎ資料 v6.0

## 概要

YatteMi!は大学生向けのスキルシェアリングプラットフォーム。

- **URL**: https://yattemi.vercel.app
- **GitHub**: https://github.com/ohkita8128/yattemi
- **Supabase**: https://lbdrqjhifussacjgwnij.supabase.co

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Lucide Icons
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **デプロイ**: Vercel

---

## 重要: よく発生するエラーと対処法

### 1. 未使用インポートエラー
```
Type error: 'XXX' is declared but its value is never read.
```
**対処**: 使ってないインポートを削除
```powershell
(Get-Content "ファイルパス" -Encoding UTF8 -Raw) -replace "  XXX,\r?\n", "" | Set-Content "ファイルパス" -Encoding UTF8 -NoNewline
```

### 2. null vs undefined 型エラー
```
Type 'string | null' is not assignable to type 'string | undefined'.
```
**対処**: 型定義を `string | null` に変更するか、`?? undefined` で変換

### 3. Supabase型エラー
```
Argument of type 'any' is not assignable to parameter of type 'never'.
```
**対処**: `(supabase as any)` でキャスト

### 4. PowerShellのパス問題（[id]フォルダ）
```powershell
# ❌ 通常のパスは動かない
Get-Content "$HOME\yatte-mi\src\app\(main)\posts\[id]\page.tsx"

# ✅ -LiteralPath を使う
Get-Content -LiteralPath "$HOME\yatte-mi\src\app\(main)\posts\[id]\page.tsx" -Encoding UTF8
```

### 5. Set のスプレッド
```
Type 'Set<string>' can only be iterated through...
```
**対処**: `[...new Set(arr)]` → `Array.from(new Set(arr))`

### 6. 配列アクセス時の undefined
```
Argument of type 'string | undefined' is not assignable...
```
**対処**: `arr[0]` → `arr[0]!` (non-null assertion)

### 7. Record型のキーアクセス
```
'OBJECT.key' is possibly 'undefined'.
```
**対処**: `OBJECT.key` → `OBJECT['key'] || []`

### 8. フォーム内のボタンがsubmitしてしまう
```
ボタンをクリックするとページ遷移してしまう
```
**対処**: `<button>` に `type="button"` を追加

### 9. .nextフォルダのエラー
```
Error: UNKNOWN: unknown error, open '...\\.next\\...'
```
**対処**: `.next`フォルダを削除して再起動
```powershell
Remove-Item -Recurse -Force "$HOME\yatte-mi\.next"
npm run dev
```

---

## ファイル編集のベストプラクティス

### 事前チェック（ビルドエラー防止）
ファイル作成時に以下を確認：
1. インポートは全て使用されているか
2. 型は `null` と `undefined` を正しく扱っているか
3. Supabaseクエリは `(supabase as any)` でキャストしているか
4. フォーム内のボタンは `type="button"` があるか

### PowerShellでの置換
```powershell
# 単純な置換
(Get-Content "ファイル" -Encoding UTF8 -Raw) -replace "古い", "新しい" | Set-Content "ファイル" -Encoding UTF8 -NoNewline

# 複数行の削除（\r?\n で改行に対応）
-replace "削除したい行\r?\n", ""
```

---

## 現在のDB構造

### 主要テーブル
| テーブル | 説明 |
|----------|------|
| profiles | ユーザープロフィール |
| posts | 投稿（teach/learn） |
| applications | 応募 |
| matches | マッチング |
| messages | チャット |
| likes | いいね |
| follows | フォロー |
| reviews | レビュー・バッジ |
| notifications | 通知 |
| categories | カテゴリ |
| profile_images | プロフィール写真（複数枚） |

### profilesテーブルのカラム
```sql
id UUID PRIMARY KEY
username TEXT
display_name TEXT
email TEXT (auth.usersから)
avatar_url TEXT
bio TEXT
university TEXT
faculty TEXT
grade TEXT -- B1, B2, B3, B4, M1, M2, D, other
birth_date DATE
gender TEXT
is_public BOOLEAN
onboarding_completed BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### postsテーブルの主要カラム
```sql
id UUID PRIMARY KEY
user_id UUID
title TEXT
description TEXT
type TEXT -- 'teach' or 'learn'
category_id INT
is_online BOOLEAN
location TEXT
is_active BOOLEAN DEFAULT true
available_days TEXT[]
available_times TEXT[]
specific_dates JSONB
my_level INT
target_level_min INT
target_level_max INT
tags TEXT[]
```

### profile_imagesテーブル
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
image_url TEXT NOT NULL
sort_order INT DEFAULT 0
created_at TIMESTAMPTZ DEFAULT now()
```

---

## Supabase Storage バケット

| バケット名 | 用途 | 公開 |
|------------|------|------|
| avatars | プロフィールアイコン | ✅ |
| profile-images | プロフィール写真（複数枚） | ✅ |

### RLSポリシー（両バケット共通）
- SELECT: 公開
- INSERT/UPDATE/DELETE: 認証ユーザーのみ

---

## 認証フロー

### 新規登録フロー
```
/register で登録
    ↓
auth.users にユーザー作成
    ↓
トリガー (on_auth_user_created) が発火
    ↓
profiles に自動でレコード作成
  - username, display_name: 登録時の入力値
  - onboarding_completed: false
    ↓
（Confirm email OFFの場合）即ログイン
    ↓
認証必要ページにアクセス
    ↓
middleware が onboarding_completed をチェック
    ↓
false なら /onboarding にリダイレクト
    ↓
オンボーディング完了 → onboarding_completed = true
    ↓
/dashboard へ
```

### トリガー（auth.users → profiles）
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username,
    display_name,
    onboarding_completed, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 実装済み機能

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（ログイン/登録） | ✅ | Supabase Auth |
| 新規登録トリガー | ✅ | profiles自動作成 |
| オンボーディング | ✅ | /onboarding |
| middleware | ✅ | 認証・オンボーディングチェック |
| 投稿CRUD | ✅ | タグ・日程対応 |
| 応募・マッチング | ✅ | |
| チャット | ✅ | Realtime |
| いいね | ✅ | 無限ループ修正済 |
| フォロー | ✅ | |
| レビュー・バッジ | ✅ | |
| 通知 | ✅ | |
| アバターアップロード | ✅ | Supabase Storage |
| プロフィール写真複数枚 | ✅ | profile_images テーブル |
| ダッシュボード | ✅ | /dashboard |
| フォロワー一覧 | ✅ | /users/[username]/follows |
| レベルシステム | ✅ | 0-10、絵文字表示 |
| タグ入力（サジェスト） | ✅ | |
| 日程選択 | ✅ | 曜日・時間帯・具体日時 |
| 検索フィルタ（レベル） | ✅ | |
| カテゴリアイコン | ✅ | Lucide Icons |

---

## 未実装・TODO

| 機能 | 優先度 | 備考 |
|------|--------|------|
| ホーム分岐（LP/ログイン後） | 高 | 元の(main)/page.tsxに統合 |
| タグで検索 | 高 | exploreに追加 |
| 曜日・時間帯フィルタ | 中 | exploreに追加 |
| オンライン/対面フィルタ | 中 | exploreに追加 |
| 通知の自動生成 | 中 | DBトリガー |
| 確認メール関連UI改善 | 中 | ON時のフロー |
| terms, privacy, contactページ | 低 | 404になってる |
| PWA対応 | 低 | |

---

## ページ構成

| パス | 説明 | 認証 |
|------|------|------|
| / | ホーム（LP） | 不要 |
| /explore | 投稿一覧・検索 | 不要 |
| /posts/[id] | 投稿詳細 | 不要 |
| /posts/new | 新規投稿 | 必要 |
| /posts/[id]/edit | 投稿編集 | 必要 |
| /users/[username] | 公開プロフィール | 不要 |
| /users/[username]/follows | フォロー一覧 | 不要 |
| /profile | 自分のプロフィールへリダイレクト | 必要 |
| /profile/edit | プロフィール編集 | 必要 |
| /onboarding | 初期設定（学校・写真・自己紹介） | 必要 |
| /dashboard | ダッシュボード | 必要 |
| /applications | 応募管理 | 必要 |
| /teach | ティーチ一覧 | 必要 |
| /challenges | チャレンジ一覧 | 必要 |
| /notifications | 通知一覧 | 必要 |
| /login | ログイン | 不要 |
| /register | 新規登録 | 不要 |

---

## コンポーネント構成

```
src/components/
├── ui/
│   ├── skeleton.tsx
│   ├── level-slider.tsx
│   ├── tag-input.tsx
│   └── schedule-selector.tsx
├── posts/
│   ├── post-card.tsx
│   ├── post-form.tsx
│   └── ...
├── profile/
│   ├── profile-image-gallery.tsx  # 写真複数枚（編集用）
│   └── profile-image-viewer.tsx   # 写真スワイプ（表示用）
├── applications/
├── reviews/
└── ...
```

---

## 重要ファイル

### middleware.ts
```
- 認証チェック
- オンボーディング未完了チェック
- ログイン/登録ページのリダイレクト
```

### src/lib/category-icons.tsx
```
- カテゴリごとのLucideアイコンマッピング
- getCategoryIcon(slug) でアイコン取得
```

### src/hooks/useProfileImages.ts
```
- プロフィール写真の取得・アップロード・削除・並び替え
```

---

## フック一覧

| フック | 説明 | 注意点 |
|--------|------|--------|
| useAuth | 認証状態管理 | |
| usePosts | 投稿CRUD | supabaseRef使用 |
| usePost | 単一投稿取得 | 閲覧数インクリメント1回のみ |
| useLikes | いいね機能 | hasFetchedで無限ループ防止 |
| useApplications | 応募管理 | |
| useMessages | チャット（リアルタイム） | |
| useReviews | レビュー・バッジ | |
| useFollow | フォロー機能 | |
| useCategories | カテゴリ取得 | use-posts.ts内 |
| useDebounce | デバウンス | |
| useProfileImages | プロフィール写真 | 複数枚対応 |

---

## 無限ループ防止パターン

```typescript
// ❌ NG: supabaseが毎回新規作成される
const supabase = getClient();
useEffect(() => {
  // ...
}, [supabase]); // 無限ループ！

// ✅ OK: useRefで安定化
const supabaseRef = useRef(getClient());
const hasFetched = useRef(false);

useEffect(() => {
  if (hasFetched.current) return;
  const supabase = supabaseRef.current;
  // ...
  hasFetched.current = true;
}, [依存配列からsupabaseを除外]);
```

---

## カテゴリ一覧

| ID | 名前 | slug | アイコン |
|----|------|------|----------|
| 1 | プログラミング | programming | Code |
| 2 | デザイン | design | Palette |
| 3 | 音楽 | music | Music |
| 4 | スポーツ | sports | Dumbbell |
| 5 | 語学 | language | Globe |
| 6 | 料理 | cooking | ChefHat |
| 7 | 写真・動画 | media | Camera |
| 8 | ビジネス | business | Briefcase |
| 9 | アート | art | Theater |
| 10 | ゲーム | gaming | Gamepad2 |
| 12 | 勉強 | study | BookOpen |
| 13 | 美容・コスメ | beauty | Sparkles |
| 14 | ファッション | fashion | Shirt |
| 15 | 資格・就活 | career | GraduationCap |
| 16 | 伝統・文化 | traditional | Landmark |
| 17 | 生活 | lifestyle | Home |
| 11 | その他 | other | MoreHorizontal |

---

## レベルシステム

| レベル | 名前 | 絵文字 |
|--------|------|--------|
| 0-1 | 見習い | 🐣 |
| 2-3 | 初心者 | 🌱 |
| 4-5 | 中級者 | 📚 |
| 6-7 | 一人前 | 🚶 |
| 8-9 | 職人 | 🔨 |
| 10 | 達人 | 🥷 |

---

## バッジシステム

### 先輩に送るバッジ（後輩が選ぶ）
- 🎓 わかりやすい！ (clear)
- 💡 ためになった！ (helpful)
- 🌟 神先輩！ (godsenpai)

### 後輩に送るバッジ（先輩が選ぶ）
- 🔥 熱心だった！ (eager)
- ✨ のみこみ早い！ (quicklearner)
- 💪 がんばり屋！ (hardworker)

### 共通バッジ
- 👏 最高だった！ (awesome)
- 💖 ありがとう！ (thanks)
- 🤝 また会いたい！ (again)

---

## Supabase Auth設定メモ

| 設定 | 状態 | 備考 |
|------|------|------|
| Email Provider | ON | |
| Confirm email | OFF（開発中） | 本番ではONにする |

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（デプロイ前に必ず実行）
npm run build

# デプロイ
git add .
git commit -m "メッセージ"
git push
```

---

## 次にやること

1. **ホーム分岐**
   - ログイン前: LP（現在の/）
   - ログイン後: おすすめ投稿、フォロー中の投稿

2. **検索フィルタ強化**
   - タグ検索
   - 曜日・時間帯フィルタ
   - オンライン/対面フィルタ

3. **静的ページ作成**
   - /terms（利用規約）
   - /privacy（プライバシーポリシー）
   - /contact（お問い合わせ）

4. **確認メールON時のフロー改善**
   - 登録後の画面
   - 確認完了後の導線

---

## 既知の問題

1. **follows テーブルの406エラー**
   - 自分自身をフォローしようとした時に発生
   - クリティカルではない

2. **Rate Limit**
   - 開発中に連続テストすると429エラー
   - 5〜10分待つか、別IPで試す

---

最終更新: 2026/01/23
