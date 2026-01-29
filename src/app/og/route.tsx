import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#fff7ed',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src="https://yattemi.vercel.app/logo.png"
          width={120}
          height={120}
        />
        <div
          style={{
            marginTop: 32,
            fontSize: 64,
            fontWeight: 800,
            color: '#f97316',
          }}
        >
          YatteMi!
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
