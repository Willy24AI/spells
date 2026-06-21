import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';
export const alt = 'Daily Bee — Free Spelling Bee, play online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBBF24',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 150,
            height: 150,
            borderRadius: 32,
            backgroundColor: '#1F2937',
            color: '#FBBF24',
            fontSize: 90,
            fontWeight: 800
          }}
        >
          B
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            color: '#1F2937'
          }}
        >
          Daily Bee
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 40,
            color: '#1F2937'
          }}
        >
          Free Spelling Bee · Play online, no subscription
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            fontWeight: 700,
            color: '#1F2937',
            opacity: 0.7
          }}
        >
          spellbee.pro
        </div>
      </div>
    ),
    { ...size }
  );
}
