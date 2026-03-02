'use client'

import Link from 'next/link'

const APP_VERSION = '0.0.1'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>&copy; {currentYear} <a href="https://platphormnews.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Platphorm News</a></span>
        <Link href="/docs" className="hover:text-foreground transition-colors">
          API Docs
        </Link>
        <Link href="/sitemap.xml" className="hover:text-foreground transition-colors">
          Sitemap
        </Link>
        <Link href="/feed.xml" className="hover:text-foreground transition-colors">
          RSS
        </Link>
        <Link href="/llms.txt" className="hover:text-foreground transition-colors">
          LLMs
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/70">json.platphormnews.com</span>
        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-medium">v{APP_VERSION}</span>
      </div>
    </footer>
  )
}
