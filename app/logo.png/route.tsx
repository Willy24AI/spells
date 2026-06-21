import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

// Square brand logo (512×512 PNG) for Organization structured data and any
// other place that needs a raster logo. Served at /logo.png.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBBF24'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 320,
            height: 320,
            borderRadius: 72,
            backgroundColor: '#1F2937',
            color: '#FBBF24',
            fontSize: 210,
            fontWeight: 800,
            fontFamily: 'sans-serif'
          }}
        >
          B
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
