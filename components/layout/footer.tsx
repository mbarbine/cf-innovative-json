import Link from 'next/link'
import { FileJson2, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileJson2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-foreground">JSON Tree</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and REST API. Parse, validate, and explore JSON data structures.
          </p>
          <div className="text-xs text-muted-foreground mt-2">
            &copy; {new Date().getFullYear()} Platphorm News. All rights reserved.
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-medium text-sm text-foreground mb-1">Resources</h3>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors">API Documentation</Link>
          <Link href="/faq" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors">FAQ</Link>
          <Link href="/roadmap" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors">Roadmap</Link>
          <Link href="/llms.txt" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors">LLMs.txt</Link>
          <Link href="/api/health" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
            Health Check <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-medium text-sm text-foreground mb-1">Network</h3>
          <a href="https://platphormnews.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
            Platphorm News <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://mcp.platphormnews.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
            MCP Platform <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://claws.platphormnews.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
            Claws Platform <ExternalLink className="w-3 h-3" />
          </a>
          <Link href="/api/mcp" className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1">
            MCP Server Endpoint <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
