import { NextRequest } from 'next/server'
import { apiResponse, apiError, generateRequestId } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  try {
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return apiError('URL is required', 400, requestId)
    }
    
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return apiError('Invalid URL format', 400, requestId)
    }
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return apiError('Only HTTP and HTTPS URLs are supported', 400, requestId)
    }
    
    // 🛡️ SECURITY: Prevent SSRF (including DNS rebinding) using a custom lookup function
    // that enforces safe IP resolution right when the socket connects.
    const dns = require('dns');
    const http = require('http');
    const https = require('https');

    const safeLookup = (hostname: string, options: any, callback: any) => {
      dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err);

        // Explicitly block 127.0.0.1, ::1, 0.0.0.0 and known private IP ranges
        const addrStr = String(address);
        const isLocalhost = addrStr === '127.0.0.1' || addrStr === '::1' || addrStr === '0.0.0.0' || addrStr.startsWith('::ffff:127.');
        const isPrivateIP = /^10\./.test(addrStr) ||
                            /^192\.168\./.test(addrStr) ||
                            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addrStr) ||
                            addrStr.startsWith('fd') || addrStr.startsWith('fc');
        const isMetadataIP = addrStr === '169.254.169.254';

        if (isLocalhost || isPrivateIP || isMetadataIP) {
          // Instead of returning an error to the callback, reject via custom error code
          const err = new Error('Access to local or private networks is restricted (SSRF Protection)');
          (err as any).code = 'ERR_SSRF_RESTRICTED';
          return callback(err);
        }

        // Return the address to let the socket connect to the safe IP.
        // It's essential we return the resolved `address` here to avoid a secondary resolution
        callback(null, address, family);
      });
    };

    const fetchJsonSafe = () => {
      return new Promise<{ text: string, status: number, statusText: string, contentType: string | null }>((resolve, reject) => {
        // We use require() because fetch() is vulnerable to DNS rebinding (TOCTOU).
        // By providing a custom `lookup` function to node's native HTTP client,
        // we evaluate the IP address right when the socket connects.
        const client = parsedUrl.protocol === 'https:' ? require('https') : require('http');
        const options = {
          lookup: safeLookup,
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'JSON-Tree/1.0'
          },
          timeout: 10000
        };
        const req = client.get(url, options, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => resolve({
            text: data,
            status: res.statusCode || 200,
            statusText: res.statusMessage || '',
            contentType: res.headers['content-type'] || null
          }));
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('TimeoutError'));
        });

        req.on('error', (err: any) => {
           // Handle immediate error emission before request starts (e.g. from mock)
           reject(err);
        });
      });
    };

    let response;
    try {
      response = await fetchJsonSafe();
    } catch (err) {
      if ((err as Error).message === 'TimeoutError') {
        throw err;
      }
      if (
        (err as any).code === 'ERR_SSRF_RESTRICTED' ||
        (err as Error).message.includes('SSRF Protection') ||
        ((err as any).cause && (err as any).cause.message && (err as any).cause.message.includes('SSRF Protection'))
      ) {
        return apiError('Access to local or private networks is restricted (SSRF Protection)', 403, requestId);
      }
      return apiError(`Failed to fetch URL: ${(err as Error).message}`, 400, requestId);
    }

    if (response.status < 200 || response.status >= 300) {
      return apiError(`Failed to fetch URL: ${response.status} ${response.statusText}`, 502, requestId)
    }

    const text = response.text;
    
    // Validate it's valid JSON
    try {
      JSON.parse(text)
    } catch {
      return apiError('URL does not return valid JSON', 422, requestId)
    }
    
    // Limit response size (5MB max)
    if (text.length > 5 * 1024 * 1024) {
      return apiError('JSON response is too large (max 5MB)', 413, requestId)
    }
    
    return apiResponse({ 
      json: text,
      url: url,
      size: text.length,
      contentType: response.headers.get('content-type')
    }, 200, requestId)
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return apiError('Request timed out', 504, requestId)
    }
    
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch URL',
      500,
      requestId
    )
  }
}
