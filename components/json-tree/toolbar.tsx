'use client'

import { useState, useCallback } from 'react'
import { 
  Search, 
  TreePine, 
  Network, 
  Code2,
  Expand,
  Shrink,
  Copy,
  Download,
  Upload,
  Undo2,
  Redo2,
  Wand2,
  Minimize2,
  Check,
  Sun,
  Moon,
  Keyboard,
  ArrowLeftRight,
  Link2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ViewMode, TreeStats } from '@/lib/types'
import { formatJson, minifyJson, copyToClipboard } from '@/lib/json-utils'
import { createShareUrl } from '@/lib/sharing'
import { useTheme } from 'next-themes'

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

const viewModes: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'tree', label: 'Tree', icon: <TreePine className="w-4 h-4" /> },
  { value: 'graph', label: 'Graph', icon: <Network className="w-4 h-4" /> },
  { value: 'raw', label: 'Raw', icon: <Code2 className="w-4 h-4" /> },
]

const shortcuts = [
  { keys: ['Ctrl', 'F'], description: 'Search' },
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Format JSON' },
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Minify JSON' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy all' },
  { keys: ['Ctrl', 'E'], description: 'Expand all' },
  { keys: ['Ctrl', 'Shift', 'E'], description: 'Collapse all' },
  { keys: ['1'], description: 'Tree view' },
  { keys: ['2'], description: 'Graph view' },
  { keys: ['3'], description: 'Raw view' },
]

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
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  
  const handleShareLink = useCallback(async () => {
    if (!isValid) return
    const url = createShareUrl({ json: rawJson, viewMode })
    setShareUrl(url)
    await copyToClipboard(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }, [rawJson, viewMode, isValid])
  
  const handleImportFromUrl = useCallback(async () => {
    if (!importUrl.trim()) return
    
    setImporting(true)
    setImportError(null)
    
    try {
      const response = await fetch('/api/v1/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })
      
      const data = await response.json()
      
      if (data.success && data.data?.json) {
        setRawJson(data.data.json)
        setImportUrl('')
      } else {
        throw new Error(data.error || 'Failed to fetch JSON')
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import')
    } finally {
      setImporting(false)
    }
  }, [importUrl, setRawJson])

  const handleFormat = () => {
    try {
      setRawJson(formatJson(rawJson, 2))
    } catch {}
  }

  const handleMinify = () => {
    try {
      setRawJson(minifyJson(rawJson))
    } catch {}
  }

  const handleCopy = async () => {
    await copyToClipboard(rawJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const blob = new Blob([rawJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        setRawJson(text)
      }
    }
    input.click()
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border-b border-border bg-background">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-16"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {searchResultCount} found
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={expandAll}>
                <Expand className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={collapseAll}>
                <Shrink className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse All</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleFormat} disabled={!isValid}>
                <Wand2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Format (Ctrl+Shift+F)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleMinify} disabled={!isValid}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Minify (Ctrl+Shift+M)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
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
              <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!isValid}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleUpload}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload File</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Share & Import Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!isValid}>
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
                      />
                      <Button size="sm" onClick={handleShareLink} disabled={!isValid}>
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
                      />
                      <Button size="sm" onClick={handleImportFromUrl} disabled={importing || !importUrl.trim()}>
                        {importing ? '...' : <Download className="w-4 h-4" />}
                      </Button>
                    </div>
                    {importError && <p className="text-xs text-destructive">{importError}</p>}
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
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compare JSON</TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
              <Button variant="ghost" size="icon">
                <Keyboard className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
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
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground ml-auto">
            <span>{stats.totalNodes} nodes</span>
            <span className="text-border">|</span>
            <span>Depth: {stats.maxDepth}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
