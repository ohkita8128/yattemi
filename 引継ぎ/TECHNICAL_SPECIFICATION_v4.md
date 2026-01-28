# YatteMi! 技術仕様書 v4.0

## 概要

YatteMi!は大学生向けのスキルシェアリングプラットフォームです。

- **URL**: https://yattemi.vercel.app
- **GitHub**: https://github.com/ohkita8128/yattemi
- **Supabase**: https://lbdrqjhifussacjgwnij.supabase.co

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Lucide Icons
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **デプロイ**: Vercel

---

## データベーススキーマ

### profiles
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | auth.usersと同じ |
| username | TEXT | ユニーク、小文字英数字+アンダースコア |
| display_name | TEXT | 表示名 |
| avatar_url | TEXT | アバター画像URL |
| bio | TEXT | 自己紹介 |
| university | TEXT | 大学名 |
| department | TEXT | 学部・学科 |
| grade | INT | 学年 |
| twitter_url | TEXT | |
| instagram_url | TEXT | |
| website_url | TEXT | |
| is_public | BOOLEAN | プロフィール公開設定 |
| created_at | TIMESTAMPTZ | |

### posts
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| user_id | UUID | 投稿者 |
| title | TEXT | タイトル |
| description | TEXT | 説明 |
| type | TEXT | 'teach' or 'learn' |
| category_id | UUID | カテゴリ |
| is_online | BOOLEAN | オンライン可否 |
| location | TEXT | 場所 |
| preferred_schedule | TEXT | 希望日時 |
| my_level | INT | 自分のレベル (0-10) |
| target_level_min | INT | 対象レベル下限 (0-10) |
| target_level_max | INT | 対象レベル上限 (0-10) |
| status | TEXT | 'draft', 'published', 'closed' |
| created_at | TIMESTAMPTZ | |

### applications
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| post_id | UUID | 対象投稿 |
| applicant_id | UUID | 応募者 |
| message | TEXT | 応募メッセージ |
| status | TEXT | 'pending', 'accepted', 'rejected' |
| created_at | TIMESTAMPTZ | |

### matches
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| application_id | UUID | 元の応募 |
| status | TEXT | 'active', 'completed', 'cancelled' |
| matched_at | TIMESTAMPTZ | |
| completed_by | UUID | 完了報告者 |
| confirmed_by | UUID | 完了確認者 |
| confirmed_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

### messages
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| match_id | UUID | |
| sender_id | UUID | |
| content | TEXT | 最大1000文字 |
| is_read | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### likes
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| user_id | UUID | |
| post_id | UUID | |
| created_at | TIMESTAMPTZ | |

### follows
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| follower_id | UUID | フォローする人 |
| following_id | UUID | フォローされる人 |
| created_at | TIMESTAMPTZ | |

### reviews
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| match_id | UUID | |
| reviewer_id | UUID | レビューする人 |
| reviewee_id | UUID | レビューされる人 |
| reviewer_role | TEXT | 'senpai' or 'kouhai' |
| badges | TEXT[] | 最大3つ |
| comment | TEXT | 最大500文字 |
| created_at | TIMESTAMPTZ | |

### notifications
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| user_id | UUID | |
| type | TEXT | 通知タイプ |
| title | TEXT | |
| message | TEXT | |
| link | TEXT | |
| is_read | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### categories
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | |
| name | TEXT | |
| slug | TEXT | |
| icon | TEXT | |
| color | TEXT | |
| order | INT | |

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

## ページ構成

| パス | 説明 | 認証 |
|------|------|------|
| / | ホーム | 不要 |
| /explore | 投稿一覧・検索 | 不要 |
| /posts/[id] | 投稿詳細 | 不要 |
| /posts/new | 新規投稿 | 必要 |
| /posts/[id]/edit | 投稿編集 | 必要 |
| /users/[username] | 公開プロフィール | 不要 |
| /profile | 自分のプロフィール | 必要 |
| /profile/edit | プロフィール編集 | 必要 |
| /applications | 応募管理 | 必要 |
| /teach | ティーチ一覧（先輩として） | 必要 |
| /teach/[id] | ティーチ詳細・チャット | 必要 |
| /teach/[id]/complete | ティーチ完了・レビュー | 必要 |
| /challenges | チャレンジ一覧（後輩として） | 必要 |
| /challenges/[id] | チャレンジ詳細・チャット | 必要 |
| /challenges/[id]/complete | チャレンジ完了・レビュー | 必要 |
| /notifications | 通知一覧 | 必要 |
| /login | ログイン | 不要 |
| /register | 新規登録 | 不要 |

---

## フック一覧

| フック | 説明 |
|--------|------|
| useAuth | 認証状態管理 |
| usePosts | 投稿CRUD |
| useApplications | 応募管理 |
| useLikes | いいね機能 |
| useMessages | チャットメッセージ（リアルタイム） |
| useReviews | レビュー・バッジ |
| useChallengeActions | 完了報告・確認 |
| useFollow | フォロー機能 |
| useFollowCounts | フォロー数取得 |
| useUserStats | ユーザー統計（ティーチ/チャレンジ数、バッジ数） |
| useDebounce | デバウンス |

---

## 既知の問題と解決策

### 1. RadixUI asChild + 条件分岐
```tsx
// ❌ NG
<Button asChild>{isLoading ? <Loader /> : <Link>...</Link>}</Button>

// ✅ OK
{isLoading ? <Button><Loader /></Button> : <Link className="...">...</Link>}
```

### 2. useSearchParams
```tsx
// ❌ NG - 直接使用
export default function Page() {
  const params = useSearchParams(); // エラー
}

// ✅ OK - Suspenseでラップ
export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
function Inner() {
  const params = useSearchParams();
}
```

### 3. Supabase型エラー
```tsx
// 型エラー回避
const { data } = await (supabase as any).from('table')...
```

### 4. エラーハンドリング
```tsx
} catch (error) {
  const err = error as any;
  if (err?.code === '23505') {
    // 重複エラー
  }
}
```

---

## SQL実行順序

1. `001_initial_schema.sql` - 基本テーブル
2. `002_applications_matches.sql` - 応募・マッチング
3. `003_likes_messages.sql` - いいね・メッセージ
4. `004_challenge_reviews.sql` - レビュー・バッジ
5. `005_level_follow.sql` - レベル・フォロー

---

## 次のステップ候補

- [ ] 通知の自動生成（トリガー or アプリ側）
- [ ] アバターアップロード機能
- [ ] 検索フィルタにレベル追加
- [ ] フォロワー/フォロー中一覧ページ
- [ ] PWA対応
- [ ] メール通知

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint
```

---

最終更新: Phase 5 (レベル・フォロー・公開プロフィール)
