import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { getDeploymentConfig, getSeoPolicy, shouldRenderVercelAnalytics } from '@/lib/deployment'
import './globals.css'

const deployment = getDeploymentConfig()
const seo = getSeoPolicy()

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans'
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  metadataBase: new URL(seo.canonicalUrl),
  title: {
    default: 'JSON Tree + PlatPhorm Schema Registry',
    template: '%s | JSON Tree + PlatPhorm Schema Registry'
  },
  description: 'Public JSON tree viewer, formatter, validator, schema validation tool, and PlatPhorm schema registry for humans and agents.',
  keywords: ['JSON', 'JSON viewer', 'JSON formatter', 'JSON validator', 'JSON tree', 'JSON Schema', 'schema registry', 'JSON-LD', 'developer tools', 'API', 'MCP', 'PlatPhormNews'],
  authors: [{ name: 'PlatPhormNews', url: 'https://platphormnews.com' }],
  creator: 'PlatPhormNews',
  publisher: 'PlatPhormNews',
  generator: 'Next.js',
  applicationName: 'JSON Tree + PlatPhorm Schema Registry',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'JSON Tree + PlatPhorm Schema Registry',
    title: 'JSON Tree + PlatPhorm Schema Registry',
    description: 'Public JSON tree viewer, formatter, validator, schema registry, JSON-LD, REST API, and MCP server.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JSON Tree + PlatPhorm Schema Registry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Tree + PlatPhorm Schema Registry',
    description: 'Public JSON tree viewer, formatter, validator, schema registry, REST API, and MCP server.',
    images: ['/og-image.jpg'],
    creator: '@platphormnews',
  },
  robots: {
    index: seo.index,
    follow: seo.follow,
    googleBot: {
      index: seo.index,
      follow: seo.follow,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: seo.canonicalUrl,
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="JSON Tree RSS Feed" href="/feed.xml" />
        <script
          dangerouslySetInnerHTML={{
            // OpenNext's Cloudflare bundle preserves next-themes' esbuild name
            // helper call in the inline bootstrap without emitting the helper.
            // Function names are diagnostic only here, so a small identity shim
            // keeps the theme bootstrap working without changing its behavior.
            __html: 'globalThis.__name ||= ((target) => target);',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebApplication", "SoftwareApplication"],
              "name": "JSON Tree + PlatPhorm Schema Registry",
              "alternateName": "JSON Tree",
              "description": "Public JSON tree viewer, formatter, validator, schema validation tool, JSON-LD contract viewer, REST API, and MCP server.",
              "url": deployment.canonicalUrl,
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "version": "1.4.0",
              "author": {
                "@type": "Organization",
                "name": "PlatPhormNews",
                "url": "https://platphormnews.com"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "JSON Tree Visualization",
                "JSON Graph Visualization", 
                "JSON Formatting & Minification",
                "JSON Validation",
                "JSON Path Navigation",
                "JSON Diff Comparison",
                "URL Sharing & Import",
                "Search Functionality",
                "Dark/Light Theme",
                "REST API v1",
                "MCP Server Integration",
                "OpenAPI Documentation",
                "PlatPhorm Universal Schema Pack"
              ],
              "isAccessibleForFree": true,
              "hasPart": [
                {
                  "@type": "Dataset",
                  "name": "PlatPhorm Universal Schema Pack",
                  "url": "https://json.platphormnews.com/schemas/json/platphorm-universal-schema-pack.json"
                },
                {
                  "@type": "WebPage",
                  "name": "JSON Tree API documentation",
                  "url": "https://json.platphormnews.com/docs"
                }
              ]
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {shouldRenderVercelAnalytics() ? <Analytics /> : null}
      </body>
    </html>
  )
}
