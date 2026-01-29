import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PostDetailClient } from '@/components/posts/post-detail-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await supabase
    .from('posts')
    .select(`
      id, title, description, type,
      profiles (display_name, username),
      categories (name)
    `)
    .eq('id', params.id)
    .single();

  if (!post) {
    return {
      title: '投稿が見つかりません',
    };
  }

  const title = post.title;
  const description = post.description?.slice(0, 100) || `${(post.profiles as any)?.display_name}さんの投稿`;
  const ogImage = `https://yattemi.vercel.app/og-image.png`; // TODO: 投稿ごとのOG画像

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yattemi.vercel.app/posts/${params.id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function PostDetailPage({ params }: Props) {
  return <PostDetailClient postId={params.id} />;
}