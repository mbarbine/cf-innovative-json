export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: '-json API',
      version: '1.0.0',
      description: 'Discovery and health endpoints for -json',
      termsOfService: 'https://-json.platphormnews.com/terms'
    },
    servers: [
      { url: 'https://-json.platphormnews.com', description: 'Production' }
    ],
    paths: {
      '/api/health': { get: { summary: 'Health check', responses: { '200': { description: 'ok' } } } },
      '/api/v1/health': { get: { summary: 'Health check v1', responses: { '200': { description: 'ok' } } } },
      '/api/v1/mcp': { get: { summary: 'MCP configuration', responses: { '200': { description: 'mcp config' } } } }
    }
  };
  return new Response(JSON.stringify(openApiSpec), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
