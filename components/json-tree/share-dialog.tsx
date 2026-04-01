'use client'

import { useState, useCallback } from 'react'
import { 
  Share2, 
  Copy, 
  Check, 
  Link2, 
  QrCode,
  Download,
  Twitter,
  Linkedin,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createShareUrl, copyToClipboard, truncateForShare } from '@/lib/sharing'
import type { ViewMode } from '@/lib/types'

interface ShareDialogProps {
  json: string
  viewMode: ViewMode
  isValid: boolean
}

export function ShareDialog({ json, viewMode, isValid }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  
  const generateShareLink = useCallback(() => {
    if (!isValid) return
    const url = createShareUrl({ json, viewMode })
    setShareUrl(url)
    return url
  }, [json, viewMode, isValid])
  
  const handleCopyLink = async () => {
    const url = generateShareLink()
    if (!url) return
    
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleShareTwitter = () => {
    const url = generateShareLink()
    if (!url) return
    
    const text = `Check out this JSON structure on JSON Tree! ${truncateForShare(json, 50)}`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }
  
  const handleShareLinkedIn = () => {
    const url = generateShareLink()
    if (!url) return
    
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }
  
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return
    
    setImporting(true)
    setImportError(null)
    
    try {
      const response = await fetch(`/api/v1/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch JSON from URL')
      }
      
      const data = await response.json()
      
      if (data.success && data.data?.json) {
        // Dispatch custom event to update the editor
        window.dispatchEvent(new CustomEvent('json-import', { 
          detail: { json: data.data.json } 
        }))
      } else {
        throw new Error(data.error || 'Invalid response')
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import JSON')
    } finally {
      setImporting(false)
    }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!isValid} aria-label="Share JSON">
          <Share2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share JSON</DialogTitle>
          <DialogDescription>
            Share your JSON data or import from a URL
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl || 'Click generate to create a share link'}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button size="icon" aria-label="Copy share link" onClick={handleCopyLink} disabled={!isValid}>
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Link includes compressed JSON data (up to ~2KB)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Share on Social</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareTwitter}
                  disabled={!isValid}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareLinkedIn}
                  disabled={!isValid}
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label>Import from URL</Label>
              <div className="flex gap-2">
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://api.example.com/data.json"
                  className="font-mono text-xs"
                />
                <Button 
                  size="icon"
                  aria-label="Import JSON from URL"
                  onClick={handleImportFromUrl}
                  disabled={importing || !importUrl.trim()}
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {importError && (
                <p className="text-xs text-destructive">{importError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Paste a URL that returns JSON data
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
