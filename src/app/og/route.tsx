import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 60,
          fontWeight: 800,
          color: '#f97316',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img
            src="https://yattemi.vercel.app/logo.png"
            width={96}
            height={96}
          />
          YatteMi!
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 36,
            color: '#374151',
            fontWeight: 600,
          }}
        >
          「やってみたい」を「やってみた」に
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
