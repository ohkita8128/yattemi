// src/app/(main)/privacy/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | YatteMi!',
  description: 'YatteMi!のプライバシーポリシーです。',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">最終更新日: 2026年1月24日</p>

        <p>
          YatteMi! 運営（以下「運営」といいます）は、スキルシェア・マッチングサービス「YatteMi!」（以下「本サービス」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第1条（収集する情報）</h2>
          <p>運営は、本サービスの提供にあたり、以下の情報を収集することがあります。</p>
          
          <h3 className="text-lg font-medium mt-4">1. ユーザーから直接提供される情報</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>メールアドレス（必須）</li>
            <li>ユーザー名・表示名（必須）</li>
            <li>プロフィール画像（任意）</li>
            <li>自己紹介文（任意）</li>
            <li>大学名・学部・学年（任意）</li>
            <li>生年月日・性別（任意）</li>
            <li>SNSアカウント情報（Twitter、Instagram、Webサイト）（任意）</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">2. サービス利用時に自動的に収集される情報</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）</li>
            <li>Cookie情報（認証・セッション管理のため）</li>
            <li>本サービス内での行動履歴（投稿、いいね、メッセージ等）</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第2条（利用目的）</h2>
          <p>運営は、収集した情報を以下の目的で利用します。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスの提供・運営</li>
            <li>ユーザー認証およびアカウント管理</li>
            <li>ユーザー間のマッチングおよびコミュニケーションの促進</li>
            <li>本サービスの改善・新機能の開発</li>
            <li>利用状況の分析・統計</li>
            <li>不正利用の防止・対応</li>
            <li>お問い合わせへの対応</li>
            <li>重要なお知らせの通知</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第3条（情報の公開範囲）</h2>
          <p>以下の情報は、本サービス上で他のユーザーに公開されます。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>ユーザー名・表示名</li>
            <li>プロフィール画像</li>
            <li>自己紹介文</li>
            <li>大学名・学部・学年（登録した場合）</li>
            <li>SNSアカウント情報（登録した場合）</li>
            <li>投稿内容、レビュー、バッジ</li>
          </ul>
          <p className="mt-2">
            ※メールアドレス、生年月日、性別は他のユーザーに公開されません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第4条（第三者提供）</h2>
          <p>
            運営は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために必要がある場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第5条（外部サービスの利用）</h2>
          <p>本サービスは、以下の外部サービスを利用しています。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Supabase</strong>: データベース、認証、ファイルストレージの提供
              <br />
              <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Supabaseプライバシーポリシー
              </a>
            </li>
            <li>
              <strong>Vercel</strong>: ウェブサイトのホスティング
              <br />
              <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Vercelプライバシーポリシー
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第6条（Cookieの使用）</h2>
          <p>
            本サービスは、ユーザー認証およびセッション管理のためにCookieを使用しています。Cookieはユーザーのブラウザに保存される小さなデータファイルで、ログイン状態の維持などに使用されます。
          </p>
          <p>
            ユーザーはブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部の機能が利用できなくなる可能性があります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第7条（情報の管理）</h2>
          <p>
            運営は、収集した個人情報の漏洩、滅失またはき損の防止その他の安全管理のために必要かつ適切な措置を講じます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第8条（情報の開示・訂正・削除）</h2>
          <p>
            ユーザーは、運営に対して自己の個人情報の開示、訂正、削除を請求することができます。請求を受けた場合、運営は本人確認を行ったうえで、合理的な期間内に対応いたします。
          </p>
          <p>
            なお、アカウントの削除については、本サービス内の設定画面から行うことができます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第9条（プライバシーポリシーの変更）</h2>
          <p>
            運営は、必要に応じて本ポリシーを変更することがあります。変更した場合は、本サービス上で通知いたします。変更後のプライバシーポリシーは、本サービス上に掲示された時点から効力を生じるものとします。
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t">
          <h2 className="text-xl font-semibold">お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、下記までご連絡ください。
          </p>
          <p className="font-medium">
            YatteMi! 運営<br />
            メール: yattemi.official@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
