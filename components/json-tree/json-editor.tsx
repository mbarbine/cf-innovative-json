'use client'

import { useCallback, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
  error: string | null
  storageStatus?: string
  storageTooltip?: string
  className?: string
}

export function JsonEditor({ value, onChange, isValid, error, storageStatus = 'Local draft', storageTooltip = 'Drafts are stored in browser IndexedDB only.', className }: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // Optimize line counting to prevent memory allocation for large JSON strings
  const lineCount = useMemo(() => {
    let count = 1
    let pos = -1
    while ((pos = value.indexOf('\n', pos + 1)) !== -1) {
      count++
    }
    return count
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      
      // Set cursor position after state update
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [value, onChange])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd
    }
  }, [])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-medium text-foreground">JSON Editor</span>
          <TooltipProvider delayDuration={250}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium cursor-help',
                    isValid
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive'
                  )}
                  role="status"
                  aria-label={isValid ? "JSON is valid" : "JSON is invalid"}
                  tabIndex={0}
                >
                  {isValid ? 'Valid' : 'Invalid'}
                </span>
              </TooltipTrigger>
              <TooltipContent>{isValid ? 'The editor content parses with JSON.parse.' : 'The editor content has a JSON parse error.'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 cursor-help"
                  tabIndex={0}
                  aria-label={storageStatus}
                >
                  {storageStatus}
                </span>
              </TooltipTrigger>
              <TooltipContent>{storageTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider delayDuration={250}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help whitespace-nowrap" tabIndex={0}>
                {lineCount} lines
              </span>
            </TooltipTrigger>
            <TooltipContent>Line count is calculated from the current editor text.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="relative flex-1 overflow-hidden">
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 overflow-hidden select-none pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="p-3 font-mono text-xs text-muted-foreground text-right leading-6">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={cn(
            'absolute inset-0 w-full h-full resize-none',
            'pl-14 pr-3 py-3',
            'font-mono text-sm leading-6',
            'bg-background text-foreground',
            'border-0 outline-none focus:ring-0',
            'placeholder:text-muted-foreground'
          )}
          placeholder="Paste your JSON here..."
          aria-label="JSON Input Area"
          aria-invalid={!isValid}
          aria-errormessage={error ? 'json-editor-error' : undefined}
        />
      </div>
      
      {error && (
        <div
          id="json-editor-error"
          className="px-3 py-2 text-xs text-destructive bg-destructive/5 border-t border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  )
}
