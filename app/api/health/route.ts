import { NextResponse } from 'next/server'
import { apiResponse, corsHeaders, APP_VERSION } from '@/lib/api-utils'

const startTime = Date.now()

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  
  return apiResponse(
    {
      status: 'healthy',
      version: APP_VERSION,
      uptime,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    200
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
