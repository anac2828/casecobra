// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://casecobraac.kinde.com',
  'https://casecobra-ac2026.vercel.app',
  // Add for previews if testing branches: 'https://casecobra-ac2026-*.vercel.app'
  // 'http://localhost:3000' for dev
]

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Cache-Control',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // Cache preflight to reduce spam
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  // Allow empty/null origin (RSC/prefetch/redirects often send this)
  const isAllowedOrigin =
    allowedOrigins.includes(origin) || origin === '' || origin === null

  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin || '*' }),
      ...corsOptions,
      // Explicitly permit Kinde/RSC/custom headers
      'Access-Control-Allow-Headers': `${corsOptions['Access-Control-Allow-Headers']}, next-router-prefetch, next-router-segment-prefetch, next-url, rsc`,
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
    '/api/:path*', // All API routes
    '/api/auth/:path*', // ← Critical for Kinde: /api/auth/logout, /api/auth/callback, etc.
    '/auth-callback/:path*',
    '/:path*', // Catch root /, pages, RSC fetches, redirects
  ],
}
