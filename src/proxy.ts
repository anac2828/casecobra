// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://casecobraac.kinde.com',
  'https://casecobra-ac2026.vercel.app',
  // Temporarily add for testing previews/branches:
  // 'https://casecobra-ac2026-git-*.vercel.app',
  // For local testing only (Vercel ignores this):
  // 'http://localhost:3000',
]

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Allow-Credentials': 'true', // Required for Kinde cookies / auth
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = allowedOrigins.includes(origin)
  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsOptions,
    }

    // CRITICAL: Use new Response() with NO BODY and 204 status
    // This avoids 400 on Vercel for OPTIONS preflight
    return new Response(null, {
      status: 204,
      headers: preflightHeaders,
    })
  }

  // For the actual request
  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  // Apply all CORS options
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth-callback/:path*',
    // If your failing request is to root or other paths, add:
    // '/:path*',  // Careful: applies to EVERYTHING – test first
  ],
}
