import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // public/og-image.png を取得して直接返す
  const imageUrl = 'https://yattemi.vercel.app/og-image.png';
  
  const res = await fetch(imageUrl);
  const imageBuffer = await res.arrayBuffer();

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}