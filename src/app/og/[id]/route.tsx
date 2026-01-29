import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?id=eq.${params.id}&select=id,title,type,description`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    }
  );

  const [post] = await res.json();

  const title = post?.title || 'YatteMi!';
  const description = post?.description?.slice(0, 80) || '';
  const isSupport = post?.type === 'support';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* 左のアクセントバー */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '12px',
            background: isSupport
              ? 'linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)'
              : 'linear-gradient(180deg, #06b6d4 0%, #22d3ee 100%)',
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 60px 60px 80px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* 上部：タイプバッジ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: isSupport ? '#f3e8ff' : '#ecfeff',
                color: isSupport ? '#7c3aed' : '#0891b2',
                padding: '10px 24px',
                borderRadius: '50px',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              {isSupport ? '🎓 教えたい' : '🌱 学びたい'}
            </div>
          </div>

          {/* 中央：タイトル */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: title.length > 30 ? '48px' : '56px',
                fontWeight: 'bold',
                color: '#1f2937',
                lineHeight: 1.3,
                maxWidth: '1000px',
              }}
            >
              {title.length > 50 ? title.slice(0, 50) + '...' : title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: '24px',
                  color: '#6b7280',
                  lineHeight: 1.5,
                  maxWidth: '900px',
                }}
              >
                {description}...
              </div>
            )}
          </div>

          {/* 下部：ロゴ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                Y
              </div>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f97316' }}>
                YatteMi!
              </span>
            </div>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>
              yattemi.vercel.app
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}