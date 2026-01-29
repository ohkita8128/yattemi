import { Metadata } from 'next';
import { PostDetailClient } from '@/components/posts/post-detail-client';

export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?id=eq.${params.id}&select=id,title,description`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      cache: 'no-store',
    }
  );

  const [post] = await res.json();

  if (!post) {
    return {
      title: '投稿が見つかりません',
    };
  }

  const title = post.title;
  const description = post.description?.slice(0, 100) || 'YatteMi!の投稿';
  const ogImage = `https://yattemi.vercel.app/og/${params.id}`;

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