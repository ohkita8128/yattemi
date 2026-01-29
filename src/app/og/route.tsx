import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ロゴ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              background: 'white',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#f97316',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
          >
            Y
          </div>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            YatteMi!
          </span>
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: '32px',
            color: 'white',
            textAlign: 'center',
            opacity: 0.95,
          }}
        >
          好きを広めたい人と、新しいことを始めたい人を繋ぐ
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}