'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Users, Sparkles, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          ホームに戻る
        </Link>

        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🎯</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              YatteMi!
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            スキルシェアで、新しい自分に出会おう
          </p>
        </div>

        {/* ミッション */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-6 w-6 text-orange-500" />
            私たちのミッション
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-gray-700 leading-relaxed">
              YatteMi! は、誰もが持つスキルや知識を気軽に共有し、
              学び合えるプラットフォームです。
              「教えたい」と「学びたい」をつなぐことで、
              一人ひとりの可能性を広げ、新しい出会いと成長の機会を創出します。
            </p>
          </div>
        </section>

        {/* 特徴 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            YatteMi! の特徴
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold mb-2">気軽にマッチング</h3>
              <p className="text-sm text-gray-600">
                教えたい人と学びたい人が簡単につながる
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">多様なスキル</h3>
              <p className="text-sm text-gray-600">
                勉強からアート、スポーツまで幅広いジャンル
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="font-bold mb-2">成長の記録</h3>
              <p className="text-sm text-gray-600">
                レベルアップやバッジで成長を可視化
              </p>
            </div>
          </div>
        </section>

        {/* 運営情報 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">運営情報</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">サービス名</dt>
                <dd className="font-medium">YatteMi!（ヤッテミ）</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">お問い合わせ</dt>
                <dd>
                  <Link 
                    href="/contact" 
                    className="text-orange-600 hover:underline"
                  >
                    お問い合わせフォーム
                  </Link>
                  <span className="text-gray-500 text-sm ml-2">
                    または yattemi.official@gmail.com
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              さあ、はじめよう！
            </h2>
            <p className="mb-6 opacity-90">
              あなたのスキルを誰かのために。誰かのスキルをあなたのために。
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-white text-orange-600 font-bold rounded-xl hover:shadow-lg transition-all"
            >
              無料で登録する
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
