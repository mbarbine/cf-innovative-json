import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/api-utils'

export async function POST() {
  try {
    const urlsToRegister = [
      'https://platphormnews.com/api/network/graph',
      'https://platphormnews.com/api/docs',
      'https://mcp.platphormnews.com'
    ];

    const results = await Promise.allSettled(
      urlsToRegister.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               domain: 'json.platphormnews.com',
               url: 'https://json.platphormnews.com',
               type: 'tool',
               capabilities: ['mcp', 'api', 'docs', 'health']
            })
          });
          return { url, status: response.status };
        } catch (e) {
           return { url, error: (e as Error).message };
        }
      })
    );

    return NextResponse.json({ success: true, results }, {
      headers: corsHeaders()
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function GET() {
   return NextResponse.json({ message: "Use POST to register." }, {
      status: 405,
      headers: corsHeaders()
   })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
