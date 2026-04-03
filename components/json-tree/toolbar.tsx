'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ListTree,
  Network,
  Code2,
  Expand,
  Shrink,
  Search,
  Wand2,
  Minimize2,
  Copy,
  Check,
  Undo2,
  Redo2,
  Moon,
  Sun,
  Keyboard,
  Link2,
  Download,
  Upload,
  ArrowLeftRight,
  Loader2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Kbd } from '@/components/ui/kbd'
import { formatJson, minifyJson } from '@/lib/json-utils'
import { createShareUrl, fetchJsonFromUrl } from '@/lib/sharing'
import type { ViewMode, TreeStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResultCount: number
  rawJson: string
  setRawJson: (json: string) => void
  expandAll: () => void
  collapseAll: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  stats: TreeStats | null
  isValid: boolean
  onOpenDiff?: () => void
  isDiffOpen?: boolean
}

export function Toolbar({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  searchResultCount,
  rawJson,
  setRawJson,
  expandAll,
  collapseAll,
  undo,
  redo,
  canUndo,
  canRedo,
  stats,
  isValid,
  onOpenDiff,
  isDiffOpen
}: ToolbarProps) {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFormat = useCallback(() => {
    if (!isValid) return
    try {
      setRawJson(formatJson(rawJson, 2))
    } catch {}
  }, [rawJson, setRawJson, isValid])

  const handleMinify = useCallback(() => {
    if (!isValid) return
    try {
      setRawJson(minifyJson(rawJson))
    } catch {}
  }, [rawJson, setRawJson, isValid])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(rawJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [rawJson])
  
  const handleShareLink = useCallback(async () => {
    if (!isValid) return
    const url = createShareUrl({ json: rawJson, viewMode })
    setShareUrl(url)
    await navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }, [rawJson, viewMode, isValid])
  
  const handleImportFromUrl = useCallback(async () => {
    if (!importUrl) return
    setImporting(true)
    setImportError(null)
    try {
      // Create a proxy request or just fetch directly if CORS allows
      const json = await fetchJsonFromUrl(importUrl)
      setRawJson(json)
    } catch (error) {
      setImportError((error as Error).message)
    } finally {
      setImporting(false)
    }
  }, [importUrl, setRawJson])

  const handleDownload = useCallback(() => {
    if (!isValid) return
    const blob = new Blob([rawJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [rawJson, isValid])

  const handleUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setRawJson(result)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [setRawJson])

  const viewModes: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'tree', label: 'Tree', icon: <ListTree className="w-4 h-4" /> },
    { value: 'graph', label: 'Graph', icon: <Network className="w-4 h-4" /> },
    { value: 'raw', label: 'Raw', icon: <Code2 className="w-4 h-4" /> }
  ]

  const shortcuts = [
    { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
    { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Ctrl/Cmd', 'E'], description: 'Expand All' },
    { keys: ['Ctrl/Cmd', 'Shift', 'E'], description: 'Collapse All' },
    { keys: ['Ctrl/Cmd', 'Shift', 'F'], description: 'Format JSON' },
    { keys: ['Ctrl/Cmd', 'Shift', 'M'], description: 'Minify JSON' },
    { keys: ['Ctrl/Cmd', 'D'], description: 'Toggle Diff View' },
    { keys: ['1', '2', '3'], description: 'Switch View Modes' }
  ]

  if (!mounted) return null

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-card"
        role="toolbar"
        aria-label="JSON Tree actions"
      >
        {/* View Mode Toggle */}
        <div
          className="flex items-center gap-1 bg-muted p-1 rounded-lg"
          role="group"
          aria-label="View modes"
        >
          {viewModes.map(({ value, label, icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === value ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-1.5',
                    viewMode === value && 'bg-background shadow-sm'
                  )}
                  onClick={() => setViewMode(value)}
                  aria-label={`${label} View`}
                  aria-pressed={viewMode === value}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label} View</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-9", searchQuery ? "pr-24" : "pr-9")}
            aria-label="Search JSON"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span
                className="text-xs text-muted-foreground"
                aria-live="polite"
              >
                {searchResultCount} found
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="JSON operations"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={expandAll} aria-label="Expand All">
                <Expand className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={collapseAll} aria-label="Collapse All">
                <Shrink className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse All</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleFormat} disabled={!isValid} aria-label="Format JSON">
                <Wand2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Format (Ctrl+Shift+F)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleMinify} disabled={!isValid} aria-label="Minify JSON">
                <Minimize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Minify (Ctrl+Shift+M)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy All">
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!isValid} aria-label="Download JSON">
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleUpload} aria-label="Upload JSON">
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload File</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />
          
          {/* Share & Import Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!isValid} aria-label="Share or Import JSON">
                <Link2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share & Import</DialogTitle>
                <DialogDescription>Share your JSON or import from URL</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="share" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="share">Share</TabsTrigger>
                  <TabsTrigger value="import">Import</TabsTrigger>
                </TabsList>
                <TabsContent value="share" className="space-y-3 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Share Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl || 'Click to generate link...'}
                        readOnly
                        className="font-mono text-xs h-9"
                        aria-label="Share URL"
                      />
                      <Button size="icon" className="w-9 h-9 flex-shrink-0" onClick={handleShareLink} disabled={!isValid} aria-label="Copy Share URL">
                        {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Compressed link with your JSON data</p>
                  </div>
                </TabsContent>
                <TabsContent value="import" className="space-y-3 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Import from URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={importUrl}
                        onChange={(e) => { setImportUrl(e.target.value); setImportError(null) }}
                        placeholder="https://api.example.com/data.json"
                        className="font-mono text-xs h-9"
                        aria-label="Import URL"
                      />
                      <Button size="icon" className="w-9 h-9 flex-shrink-0" onClick={handleImportFromUrl} disabled={importing || !importUrl.trim()} aria-label="Import Data">
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                    </div>
                    {importError && <p className="text-xs text-destructive" role="alert">{importError}</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          {/* Diff Mode Toggle */}
          {onOpenDiff && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isDiffOpen ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={onOpenDiff}
                  disabled={!isValid}
                  aria-label="Compare JSON"
                  aria-pressed={isDiffOpen}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compare JSON</TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Theme</TooltipContent>
          </Tooltip>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Keyboard Shortcuts">
                <Keyboard className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>Keyboard combinations to navigate and control the editor.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                {shortcuts.map(({ keys, description }) => (
                  <div key={description} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{description}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((key, i) => (
                        <Kbd key={i}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div
            className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground ml-auto"
            role="status"
            aria-label="JSON Statistics"
          >
            <span>{stats.totalNodes} nodes</span>
            <span className="text-border" aria-hidden="true">|</span>
            <span>Depth: {stats.maxDepth}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
