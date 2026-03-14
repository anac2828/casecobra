// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://casecobraac.kinde.com',
  'https://casecobra-ac2026.vercel.app',
  // Add localhost for dev if testing locally
  // 'http://localhost:3000',
]

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Allow-Credentials': 'true',
  // Optional: Cache preflight responses (reduces OPTIONS spam)
  'Access-Control-Max-Age': '86400',
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  // Allow empty/null origin (common for same-origin prefetch)
  const isAllowedOrigin =
    allowedOrigins.includes(origin) || origin === '' || origin === null

  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin || '*' }),
      ...corsOptions,
      // Explicitly allow Next.js prefetch headers to pass CORS check
      'Access-Control-Allow-Headers': `${corsOptions['Access-Control-Allow-Headers']}, next-router-prefetch, next-router-segment-prefetch, next-url, rsc, next-router-state-tree`,
    }

    return new Response(null, {
      status: 204,
      headers: preflightHeaders,
    })
  }

  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth-callback/:path*',
    '/:path*', // ← Critical: catches root /, all pages, prefetch requests
  ],
}
