import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans'
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://json-tree.vercel.app'),
  title: {
    default: 'JSON Tree - Visualize, Format & Validate JSON',
    template: '%s | JSON Tree'
  },
  description: 'A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and API. Parse, validate, and explore JSON data structures with ease.',
  keywords: ['JSON', 'JSON viewer', 'JSON formatter', 'JSON validator', 'JSON tree', 'JSON visualizer', 'JSON parser', 'developer tools', 'API'],
  authors: [{ name: 'JSON Tree' }],
  creator: 'JSON Tree',
  publisher: 'JSON Tree',
  generator: 'Next.js',
  applicationName: 'JSON Tree',
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
    siteName: 'JSON Tree',
    title: 'JSON Tree - Visualize, Format & Validate JSON',
    description: 'A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and API.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JSON Tree - JSON Visualization Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Tree - Visualize, Format & Validate JSON',
    description: 'A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and API.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
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
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="JSON Tree RSS Feed" href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "JSON Tree",
              "description": "A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and API.",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://json-tree.vercel.app",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "JSON Tree Visualization",
                "JSON Graph Visualization", 
                "JSON Formatting",
                "JSON Minification",
                "JSON Validation",
                "Search Functionality",
                "Dark/Light Theme",
                "REST API",
                "MCP Server"
              ]
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
