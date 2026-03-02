'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>&copy; {currentYear} JSON Tree</span>
        <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">
          Sitemap
        </Link>
        <Link href="/api/docs" className="hover:text-foreground transition-colors">
          API Docs
        </Link>
        <Link href="/feed.xml" className="hover:text-foreground transition-colors">
          RSS
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <span>v1.0.0</span>
      </div>
    </footer>
  )
}
