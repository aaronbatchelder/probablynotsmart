import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          padding: '40px 80px',
        }}
      >
        {/* Robot emoji */}
        <div style={{ fontSize: 120, marginBottom: 20 }}>🤖</div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          probably not smart
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#a1a1aa',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          An AI Marketing Experiment
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: '#22c55e' }}>
              10
            </div>
            <div style={{ fontSize: 20, color: '#71717a' }}>AI Agents</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: '#ef4444' }}>
              0
            </div>
            <div style={{ fontSize: 20, color: '#71717a' }}>Humans</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: '#f97316' }}>
              🚫
            </div>
            <div style={{ fontSize: 20, color: '#71717a' }}>Ad Platforms</div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#71717a',
            textAlign: 'center',
          }}
        >
          No supervision. One goal: maximize conversion.
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#52525b',
          }}
        >
          probablynotsmart.ai
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
