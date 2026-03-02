'use client'

import { memo, useState } from 'react'
import { ChevronRight, Copy, Check, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { generateJsonPath, copyToClipboard } from '@/lib/sharing'

interface PathBreadcrumbProps {
  path: string[]
  onNavigate?: (path: string[]) => void
  className?: string
}

export const PathBreadcrumb = memo(function PathBreadcrumb({
  path,
  onNavigate,
  className
}: PathBreadcrumbProps) {
  const [copied, setCopied] = useState(false)
  
  if (!path || path.length === 0) return null
  
  const jsonPath = generateJsonPath(path)
  
  const handleCopy = async () => {
    await copyToClipboard(jsonPath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  
  const handleSegmentClick = (index: number) => {
    if (onNavigate) {
      onNavigate(path.slice(0, index + 1))
    }
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        'flex items-center gap-1 px-3 py-2 bg-muted/50 border-b border-border',
        'text-sm font-mono overflow-x-auto',
        className
      )}>
        <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {path.map((segment, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-0.5 flex-shrink-0" />
              )}
              <button
                onClick={() => handleSegmentClick(index)}
                className={cn(
                  'px-1.5 py-0.5 rounded hover:bg-accent transition-colors',
                  'text-foreground hover:text-primary',
                  index === path.length - 1 && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {/^\d+$/.test(segment) ? `[${segment}]` : segment}
              </button>
            </div>
          ))}
        </div>
        
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline px-2">
            {jsonPath}
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy JSON Path</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
})
