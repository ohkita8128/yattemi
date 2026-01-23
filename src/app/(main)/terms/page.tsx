// src/app/(main)/terms/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | YatteMi!',
  description: 'YatteMi!の利用規約です。',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">最終更新日: 2026年1月24日</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第1条（適用）</h2>
          <p>
            本規約は、YatteMi! 運営（以下「運営」といいます）が提供するスキルシェア・マッチングサービス「YatteMi!」（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意のうえ、本サービスをご利用いただきます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第2条（定義）</h2>
          <p>本規約において、以下の用語は次の意味を持つものとします。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>「ユーザー」とは、本サービスに登録した利用者をいいます。</li>
            <li>「教える人」とは、スキルや知識を提供するユーザーをいいます。</li>
            <li>「学ぶ人」とは、スキルや知識を学ぶユーザーをいいます。</li>
            <li>「投稿」とは、ユーザーが本サービス上に掲載するスキル提供・学習希望の情報をいいます。</li>
            <li>「マッチング」とは、教える人と学ぶ人の間で成立する合意をいいます。</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第3条（登録）</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>本サービスの利用を希望する方は、本規約に同意のうえ、運営の定める方法によりユーザー登録を行うものとします。</li>
            <li>登録希望者が以下のいずれかに該当する場合、運営は登録を拒否することがあります。
              <ul className="list-disc pl-6 mt-1">
                <li>登録情報に虚偽、誤記または記載漏れがあった場合</li>
                <li>過去に本規約に違反したことがある場合</li>
                <li>その他、運営が登録を適当でないと判断した場合</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第4条（ユーザーIDおよびパスワードの管理）</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを管理するものとします。</li>
            <li>ユーザーは、ユーザーIDおよびパスワードを第三者に利用させ、または譲渡・貸与することはできません。</li>
            <li>ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第5条（禁止事項）</h2>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>運営または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーに対する嫌がらせや誹謗中傷</li>
            <li>虚偽の情報を登録・投稿する行為</li>
            <li>本サービスを通じて取得した情報を営利目的で利用する行為</li>
            <li>反社会的勢力に対する利益供与その他の協力行為</li>
            <li>面識のない異性との出会いや交際を目的とする行為</li>
            <li>宗教活動、政治活動の勧誘行為</li>
            <li>本サービスの趣旨に反する利用行為</li>
            <li>その他、運営が不適切と判断する行為</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第6条（本サービスの提供の停止等）</h2>
          <p>
            運営は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
            <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、運営が本サービスの提供が困難と判断した場合</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第7条（退会）</h2>
          <p>
            ユーザーは、運営の定める手続きにより、いつでも退会することができます。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第8条（保証の否認および免責事項）</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>運営は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。</li>
            <li>運営は、ユーザー間のマッチングやコミュニケーションについて一切関与せず、トラブルについて責任を負いません。</li>
            <li>運営は、本サービスによってユーザーに生じたあらゆる損害について、運営の故意または重過失による場合を除き、一切の責任を負いません。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第9条（サービス内容の変更等）</h2>
          <p>
            運営は、ユーザーに通知することなく、本サービスの内容を変更または本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第10条（利用規約の変更）</h2>
          <p>
            運営は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲示された時点から効力を生じるものとします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第11条（準拠法・裁判管轄）</h2>
          <p>
            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営の所在地を管轄する裁判所を専属的合意管轄とします。
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t">
          <h2 className="text-xl font-semibold">お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは、下記までご連絡ください。
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
