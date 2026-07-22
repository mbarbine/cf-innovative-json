import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'JSON Tree - Visualize, Format & Validate JSON'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
          backgroundImage: 'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <path d="M8 10h3l2 6-2 6H8l2-6-2-6z" fill="#0a0a0a"/>
              <path d="M24 10h-3l-2 6 2 6h3l-2-6 2-6z" fill="#0a0a0a"/>
              <circle cx="16" cy="16" r="2" fill="#0a0a0a"/>
            </svg>
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
            }}
          >
            JSON Tree
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#a1a1aa',
            marginBottom: 48,
          }}
        >
          Visualize, Format & Validate JSON
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 24,
          }}
        >
          {['Tree View', 'Graph View', 'API', 'MCP Server'].map((feature) => (
            <div
              key={feature}
              style={{
                padding: '12px 24px',
                backgroundColor: '#27272a',
                borderRadius: 8,
                color: '#fafafa',
                fontSize: 18,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
