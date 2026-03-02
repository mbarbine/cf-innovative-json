'use client'

import Link from 'next/link'
import { Github, ExternalLink, FileJson2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const APP_VERSION = '0.0.1'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileJson2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-foreground leading-tight">JSON Tree</span>
            <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">by Platphorm News</span>
          </div>
        </Link>
        <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 rounded-full">
          v{APP_VERSION}
        </span>
      </div>

      <nav className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              API
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/api/docs" className="flex items-center gap-2">
                <FileJson2 className="w-4 h-4" />
                API Documentation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/api/health" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Health Check
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/mcp" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                MCP Server
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/llms.txt">
            LLMs.txt
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </Button>
      </nav>
    </header>
  )
}
