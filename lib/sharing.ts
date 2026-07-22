// URL sharing and compression utilities
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export interface ShareOptions {
  json: string
  viewMode?: 'tree' | 'graph' | 'raw'
  expandedLevel?: number
}

export interface SourceUrlOptions {
  sourceUrl: string
  viewMode: 'tree' | 'graph' | 'raw'
}

export function createShareUrl(options: ShareOptions): string {
  const { json, viewMode = 'graph', expandedLevel = 2 } = options
  
  // Compress the JSON to make the URL shorter
  const compressed = compressToEncodedURIComponent(json)
  
  const params = new URLSearchParams()
  params.set('d', compressed)
  if (viewMode !== 'graph') params.set('v', viewMode)
  if (expandedLevel !== 2) params.set('e', String(expandedLevel))
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://json.platphormnews.com'
  
  return `${baseUrl}?${params.toString()}`
}

export function parseShareUrl(url: string): ShareOptions | null {
  try {
    const urlObj = new URL(url)
    const compressed = urlObj.searchParams.get('d')
    
    if (!compressed) return null
    
    const json = decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    
    // Validate it's actual JSON
    JSON.parse(json)
    
    return {
      json,
      viewMode: parseViewMode(urlObj.searchParams.get('v')),
      expandedLevel: parseInt(urlObj.searchParams.get('e') || '2', 10)
    }
  } catch {
    return null
  }
}

export function parseUrlParams(): ShareOptions | null {
  if (typeof window === 'undefined') return null
  
  const params = new URLSearchParams(window.location.search)
  const compressed = params.get('d')
  
  if (!compressed) return null
  
  try {
    const json = decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    
    // Validate it's actual JSON
    JSON.parse(json)
    
    return {
      json,
      viewMode: parseViewMode(params.get('v')),
      expandedLevel: parseInt(params.get('e') || '2', 10)
    }
  } catch {
    return null
  }
}

export function parseSourceUrlParams(): SourceUrlOptions | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const sourceUrl = params.get('url')
  if (!sourceUrl) return null

  try {
    const parsed = new URL(sourceUrl)
    if (parsed.protocol !== 'https:') return null
    return {
      sourceUrl: parsed.toString(),
      viewMode: parseViewMode(params.get('v')),
    }
  } catch {
    return null
  }
}

export async function fetchJsonFromUrl(url: string): Promise<string> {
  const response = await fetch('/api/v1/fetch-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new Error(failure?.error?.message || `Failed to fetch JSON: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json() as { ok?: boolean; data?: { json?: string }; error?: { message?: string } }
  if (!payload.ok || typeof payload.data?.json !== 'string') {
    throw new Error(payload.error?.message || 'Trusted JSON import returned an invalid response')
  }
  JSON.parse(payload.data.json)
  return payload.data.json
}

function parseViewMode(value: string | null): 'tree' | 'graph' | 'raw' {
  return value === 'tree' || value === 'raw' || value === 'graph' ? value : 'graph'
}

export function generateJsonPath(path: string[]): string {
  if (path.length === 0) return '$'
  
  return path.reduce((acc, segment, index) => {
    if (index === 0) return '$'
    
    // Check if segment is an array index
    if (/^\d+$/.test(segment)) {
      return `${acc}[${segment}]`
    }
    
    // Check if segment needs bracket notation
    if (/[^a-zA-Z0-9_]/.test(segment) || /^\d/.test(segment)) {
      return `${acc}["${segment}"]`
    }
    
    return `${acc}.${segment}`
  }, '')
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      resolve()
    } catch (err) {
      reject(err)
    } finally {
      document.body.removeChild(textArea)
    }
  })
}

// Shorten the JSON for display (first 100 chars)
export function truncateForShare(json: string, maxLength: number = 100): string {
  if (json.length <= maxLength) return json
  return json.slice(0, maxLength) + '...'
}
