# YatteMi! Phase 11 引継ぎ資料

## 基本情報
- **本番URL**: https://yattemi.vercel.app
- **ローカル**: `C:\Users\wakel\Documents\ohkita\GitHub\yattemi`
- **技術スタック**: Next.js 14 + TypeScript + Tailwind + Supabase + Vercel
- **作業日**: 2026年1月29日

---

## Phase 11 完了タスク

### 1. PWA対応 ✅

**問題**: iPhoneでホーム画面追加してもSafariで開いてしまう

**原因**: next-pwaがApp Router + webpack競合でService Workerを生成していなかった

**解決策**: next-pwa削除 → 手動Service Worker実装

```js
// public/sw.js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
```

```tsx
// src/components/ServiceWorkerRegister.tsx
'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.log('SW registration failed:', err));
    }
  }, []);
  return null;
}
```

**middleware.ts修正**: `sw.js` と `manifest.json` を除外に追加
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### 2. パフォーマンス最適化 ✅

#### バンドルサイズ削減

**browser-image-compression を dynamic import化**
```typescript
// src/lib/image-compression.ts
// Before: import imageCompression from 'browser-image-compression';
// After: 使用時に動的import
const imageCompression = (await import('browser-image-compression')).default;
```

**next.config.js でチャンク分離**
```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks.cacheGroups = {
      imageCompression: {
        name: 'image-compression',
        test: /[\\/]node_modules[\\/]browser-image-compression[\\/]/,
        chunks: 'all',
        priority: 40,
      },
      // ... other cache groups
    };
  }
  return config;
}
```

**結果**: vendor.js 993KB → 944KB (-50KB)

#### Middleware最適化

**公開ページは認証チェックをスキップ**
```typescript
// src/middleware.ts
const isPublicPath = publicPaths.some(path => pathname === path) || ...;

if (isPublicPath) {
  return NextResponse.next();  // Supabaseアクセスなし
}
```

#### コールドスタート対策

**UptimeRobot設定済み**
- URL: https://yattemi.vercel.app
- Interval: 5 minutes
- 効果: wait時間 2000ms → 100-200ms

---

### 3. ブロック機能 ✅

#### データベース

```sql
-- blocksテーブル
CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocks FOR DELETE USING (auth.uid() = blocker_id);
```

#### 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/hooks/use-blocked-users.ts` | ブロックリスト取得hook |
| `src/app/(main)/users/[username]/page.tsx` | プロフィールにブロックボタン追加 |
| `src/app/(main)/explore/page.tsx` | 投稿フィルタリング |
| `src/app/(main)/page.tsx` | ホームフィルタリング |
| `src/app/(main)/matches/page.tsx` | メッセージ一覧フィルタリング |
| `src/app/(main)/settings/blocked/page.tsx` | ブロックリストページ |
| `src/app/(main)/settings/layout.tsx` | 設定メニューに追加 |

#### ブロック時の挙動

| 場所 | 挙動 |
|------|------|
| プロフィール | 「…」メニューからブロック/解除 |
| Explore | ブロックした人の投稿が非表示 |
| ホーム | ブロックした人の投稿が非表示 |
| メッセージ一覧 | ブロックした相手とのマッチが非表示 |
| 設定 | ブロックリストページで確認・解除可能 |

---

## ファイル構成（新規・変更）

```
src/
├── components/
│   └── ServiceWorkerRegister.tsx  # 新規
├── hooks/
│   └── use-blocked-users.ts       # 新規
├── app/(main)/
│   ├── page.tsx                   # 変更（ブロックフィルタ）
│   ├── explore/page.tsx           # 変更（ブロックフィルタ）
│   ├── matches/page.tsx           # 変更（ブロックフィルタ）
│   ├── users/[username]/page.tsx  # 変更（ブロックボタン）
│   └── settings/
│       ├── layout.tsx             # 変更（メニュー追加）
│       └── blocked/page.tsx       # 新規
├── middleware.ts                  # 変更（最適化+除外追加）
└── lib/
    └── image-compression.ts       # 変更（dynamic import）
public/
└── sw.js                          # 新規
```

---

## パフォーマンス測定結果

### Fast 4G環境
| 指標 | 値 |
|------|-----|
| DOMContentLoaded | 0.42秒 |
| Load | 0.73秒 |
| PageSpeed Score | 93点 |

### 3G環境（最悪ケース）
| 指標 | 値 |
|------|-----|
| DOMContentLoaded | 5秒 |
| Load | 11秒 |
※3Gでは993KBのJSダウンロードに時間がかかるため

---

## 次回タスク（優先度順）

### 高優先度
- [ ] PWA実機確認（iPhoneでホーム画面追加→スタンドアロン起動）
- [ ] DM機能の検討（相互フォロー限定など）

### 中優先度
- [ ] Image `sizes` prop警告の修正
- [ ] react-image-crop のチャンク分離
- [ ] 通知ページでのブロックフィルタリング

### 低優先度
- [ ] ブロック時にフォロー解除するか検討
- [ ] 相手からの応募をブロックで拒否する機能

---

## 技術メモ

### PWA要件（iOS Safari）
| 要件 | 必須度 |
|------|--------|
| manifest.json (`display: standalone`) | ✅ 必須 |
| apple-mobile-web-app-capable | ✅ 必須 |
| Service Worker | △ iOS単体では不要だがAndroidで必須 |

### バンドル分析コマンド
```powershell
# Windows PowerShell
$env:ANALYZE="true"; npm run build
```

### middleware除外パターン
正規表現で静的ファイルを除外：
```
/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)
```

---

## 過去の引継ぎ資料
- Phase 10: `/mnt/user-data/uploads/yattemi-handover-phase10-complete.md`
- Phase 9: チャットUI改善、OGP、SEO
- Phase 8: ダッシュボード刷新、ボトムナビ

---

## 注意事項

1. **middleware.ts** は `src/middleware.ts` のみ使用（ルートにあった重複ファイルは削除済み）
2. **ブロック機能** はデータを削除せず非表示にするだけ（解除で復活）
3. **UptimeRobot** で5分ごとにpingを送信中（コールドスタート対策）
