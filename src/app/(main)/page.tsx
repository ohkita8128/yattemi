import Link from 'next/link';
import { ArrowRight, Sparkles, Users, Zap, Shield, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES, POST_TYPES } from '@/lib/constants';

const features = [
  {
    icon: Sparkles,
    title: '新しい出会い',
    description: '趣味や技術を通じて、同じ興味を持つ仲間と出会えます。',
  },
  {
    icon: Users,
    title: 'スキルシェア',
    description: '教えることで自分も成長。学ぶことで新しい世界が広がります。',
  },
  {
    icon: Zap,
    title: 'かんたん3ステップ',
    description: '投稿して、マッチして、つながる。シンプルな仕組みです。',
  },
  {
    icon: Shield,
    title: '安心のコミュニティ',
    description: '大学生を中心とした、安心できるコミュニティです。',
  },
];

const categories = [
  { name: 'プログラミング', emoji: '💻', color: 'bg-blue-100 text-blue-700' },
  { name: 'デザイン', emoji: '🎨', color: 'bg-pink-100 text-pink-700' },
  { name: '音楽', emoji: '🎵', color: 'bg-purple-100 text-purple-700' },
  { name: 'スポーツ', emoji: '⚽', color: 'bg-green-100 text-green-700' },
  { name: '語学', emoji: '🌍', color: 'bg-yellow-100 text-yellow-700' },
  { name: '料理', emoji: '🍳', color: 'bg-red-100 text-red-700' },
];

const testimonials = [
  {
    name: '田中さん',
    role: '大学3年生',
    content: 'プログラミングを教えてくれる先輩と出会えて、就活の相談もできるようになりました！',
    avatar: '👨‍🎓',
  },
  {
    name: '佐藤さん',
    role: '大学2年生',
    content: 'ギターを教えることで、自分のスキルも再確認できました。教えることの楽しさを知りました。',
    avatar: '👩‍🎓',
  },
  {
    name: '鈴木さん',
    role: '大学4年生',
    content: '料理好き同士で集まって、定期的に料理会をしています。友達の輪が広がりました！',
    avatar: '🧑‍🎓',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-teal-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.1),transparent_50%)]" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Star className="w-3.5 h-3.5 mr-1.5 fill-yellow-400 text-yellow-400" />
              大学生に人気のスキルシェアアプリ
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              「やってみたい」を
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                「やってみた」
              </span>に
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
              趣味や技術を教えたい人と学びたい人をつなぐ
              <br className="hidden md:block" />
              スキルシェアプラットフォーム
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={ROUTES.REGISTER}
                className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                無料で始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href={ROUTES.EXPLORE}
                className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all"
              >
                投稿を見てみる
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              ✓ 完全無料 ✓ 登録1分 ✓ 今すぐ使える
            </p>
          </div>
        </div>
      </section>

      {/* Post Types Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              2つのタイプで投稿
            </h2>
            <p className="text-gray-500">
              教える側も、学ぶ側も、どちらでも投稿できます
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{POST_TYPES.teach.emoji}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-purple-600">教えたい</h3>
                    <p className="text-sm text-gray-500">Teach</p>
                  </div>
                </div>
                <p className="text-gray-500 mb-6">
                  {POST_TYPES.teach.description}
                </p>
                <Link
                  href={`${ROUTES.POST_NEW}?type=teach`}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  教えたいを投稿する
                </Link>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-cyan-100 hover:border-cyan-300 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{POST_TYPES.learn.emoji}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-cyan-600">教えてほしい</h3>
                    <p className="text-sm text-gray-500">Learn</p>
                  </div>
                </div>
                <p className="text-gray-500 mb-6">
                  {POST_TYPES.learn.description}
                </p>
                <Link
                  href={`${ROUTES.POST_NEW}?type=learn`}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  教えてほしいを投稿する
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              人気のカテゴリ
            </h2>
            <p className="text-gray-500">
              さまざまなジャンルで仲間を見つけよう
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`${ROUTES.EXPLORE}?category=${category.name}`}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full ${category.color} font-medium hover:scale-105 transition-transform`}
              >
                <span>{category.emoji}</span>
                {category.name}
              </Link>
            ))}
            <Link
              href={ROUTES.EXPLORE}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gray-100 text-gray-700 font-medium hover:scale-105 transition-transform"
            >
              その他 →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              YatteMi!の特徴
            </h2>
            <p className="text-gray-500">
              シンプルで使いやすい、スキルシェアの新しいかたち
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-6">
                <CardContent className="pt-4 space-y-4">
                  <div className="mx-auto w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-500">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ユーザーの声
            </h2>
            <p className="text-gray-500">
              実際に使っている人たちの感想
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="p-6">
                <CardContent className="pt-4 space-y-4">
                  <p className="text-gray-500">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{testimonial.avatar}</span>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            さあ、始めよう
          </h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            登録は無料。今すぐアカウントを作成して、
            <br className="hidden md:block" />
            新しいスキルと仲間を見つけましょう。
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold rounded-2xl bg-white text-orange-600 hover:bg-gray-50 transition-all"
          >
            無料で始める
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
