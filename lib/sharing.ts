// URL sharing and compression utilities
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export interface ShareOptions {
  json: string
  viewMode?: 'tree' | 'graph' | 'raw'
  expandedLevel?: number
}

export function createShareUrl(options: ShareOptions): string {
  const { json, viewMode = 'tree', expandedLevel = 2 } = options
  
  // Compress the JSON to make the URL shorter
  const compressed = compressToEncodedURIComponent(json)
  
  const params = new URLSearchParams()
  params.set('d', compressed)
  if (viewMode !== 'tree') params.set('v', viewMode)
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
      viewMode: (urlObj.searchParams.get('v') as ShareOptions['viewMode']) || 'tree',
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
      viewMode: (params.get('v') as ShareOptions['viewMode']) || 'tree',
      expandedLevel: parseInt(params.get('e') || '2', 10)
    }
  } catch {
    return null
  }
}

export async function fetchJsonFromUrl(url: string): Promise<string> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.status} ${response.statusText}`)
  }
  
  const contentType = response.headers.get('content-type')
  
  // Accept JSON content types
  if (!contentType?.includes('json') && !contentType?.includes('text')) {
    throw new Error('URL does not return JSON content')
  }
  
  const text = await response.text()
  
  // Validate it's valid JSON
  JSON.parse(text)
  
  return text
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
