import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../app/api/v1/fetch-url/route'
import { NextRequest } from 'next/server'
import dns from 'dns'
import http from 'http'
import https from 'https'

// Mock the NextRequest constructor
const createMockRequest = (body: any) => {
  return new NextRequest('http://localhost/api/v1/fetch-url', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

describe('POST /api/v1/fetch-url (SSRF Protection)', () => {
  let dnsLookupSpy: any;
  let httpGetSpy: any;
  let httpsGetSpy: any;

  beforeEach(() => {
    // Mock dns.lookup to instantly return the IP we want to test
    dnsLookupSpy = vi.spyOn(dns, 'lookup').mockImplementation(((hostname: any, options: any, callback: any) => {
      // simulate resolving localhost or an IP to itself to avoid network delays
      let ip = hostname;
      if (hostname === 'localhost') ip = '127.0.0.1';
      // callback signature: err, address, family
      if (typeof options === 'function') {
        process.nextTick(() => options(null, ip, 4));
      } else if (typeof callback === 'function') {
        process.nextTick(() => callback(null, ip, 4));
      }
    }) as any);

    // Mock http.get to actually trigger the custom lookup to enforce SSRF checks
    httpGetSpy = vi.spyOn(http, 'get').mockImplementation((url, options, callback) => {
      const req = new (require('events').EventEmitter)();
      (req as any).destroy = vi.fn();
      if ((options as any).lookup) {
        // Trigger the lookup to ensure SSRF protection fires
        // Ensure we pass a hostname to resolve properly via our mocked dns
        const hostname = new URL(url as string).hostname;
        (options as any).lookup(hostname, {}, (err: any) => {
           if (err) req.emit('error', err);
           else setTimeout(() => req.emit('error', new Error('Mocked Network Error')), 10);
        });
      } else {
        setTimeout(() => req.emit('error', new Error('Mocked Network Error')), 10);
      }
      return req as any;
    });

    httpsGetSpy = vi.spyOn(https, 'get').mockImplementation((url, options, callback) => {
      const req = new (require('events').EventEmitter)();
      (req as any).destroy = vi.fn();
      if ((options as any).lookup) {
        // Trigger the lookup to ensure SSRF protection fires
        const hostname = new URL(url as string).hostname;
        (options as any).lookup(hostname, {}, (err: any) => {
           if (err) req.emit('error', err);
           else setTimeout(() => req.emit('error', new Error('Mocked Network Error')), 10);
        });
      } else {
        setTimeout(() => req.emit('error', new Error('Mocked Network Error')), 10);
      }
      return req as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // We'll mock the 'http' and 'https' modules to intercept the outgoing request
  // without actually hitting network for the SSRF tests.
  // Actually, wait, Vitest intercepts imports.

  it('should block local IP address 127.0.0.1', async () => {
    const req = createMockRequest({ url: 'http://127.0.0.1/admin' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Access to local or private networks is restricted');
  }, 10000);

  it('should block cloud metadata IP 169.254.169.254', async () => {
    const req = createMockRequest({ url: 'http://169.254.169.254/latest/meta-data/' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Access to local or private networks is restricted');
  }, 10000);

  it('should block private network IP 192.168.1.1', async () => {
    const req = createMockRequest({ url: 'http://192.168.1.1/config' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Access to local or private networks is restricted');
  }, 10000);

  it('should block private network IP 10.0.0.1', async () => {
    const req = createMockRequest({ url: 'http://10.0.0.1/secret' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Access to local or private networks is restricted');
  }, 10000);

  it('should block localhost string (which resolves to 127.0.0.1 or ::1)', async () => {
    const req = createMockRequest({ url: 'http://localhost:3000/api' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('Access to local or private networks is restricted');
  }, 10000);

  it('should return 400 for invalid URLs', async () => {
    const req = createMockRequest({ url: 'not-a-url' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid URL format');
  });

  it('should return 400 for non HTTP/HTTPS URLs', async () => {
    const req = createMockRequest({ url: 'ftp://example.com' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Only HTTP and HTTPS URLs are supported');
  });
});
