// OpenNext creates this module during `pnpm cf:build`.
// @ts-ignore generated module intentionally does not exist before the Cloudflare build
import openNextWorker from '../.open-next/worker.js'

type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

export default {
  async fetch(request: Request, env: CloudflareEnv, context: WorkerContext): Promise<Response> {
    const requestHeaders = new Headers(request.headers)
    if (!requestHeaders.has('x-platphorm-request-started-at')) {
      requestHeaders.set('x-platphorm-request-started-at', new Date().toISOString())
    }

    const response = await openNextWorker.fetch(
      new Request(request, { headers: requestHeaders }),
      env,
      context,
    )

    if (env.PLATPHORM_CANARY !== 'true') return response

    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  },
}
