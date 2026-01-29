import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 装飾の円 */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(249, 115, 22, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(249, 115, 22, 0.08)',
          }}
        />

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
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              fontWeight: 'bold',
              boxShadow: '0 10px 40px rgba(249, 115, 22, 0.3)',
            }}
          >
            Y
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            YatteMi!
          </span>
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: '36px',
            color: '#78350f',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          好きを広めたい人と、新しいことを始めたい人を繋ぐ
        </div>

        {/* サブテキスト */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '12px 28px',
              borderRadius: '50px',
              fontSize: '22px',
              fontWeight: 600,
            }}
          >
            🎓 教えたい
          </div>
          <div
            style={{
              background: '#ecfeff',
              color: '#0e7490',
              padding: '12px 28px',
              borderRadius: '50px',
              fontSize: '22px',
              fontWeight: 600,
            }}
          >
            🌱 学びたい
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
