import { NextResponse } from 'next/server';
import { rateLimit } from './lib/rateLimit';

export function middleware(request) {
  // Only apply rate limiting to auth POST requests
  if (request.nextUrl.pathname.startsWith('/api/auth/') && request.method === 'POST') {
    // Check rate limit
    const rateLimitResult = rateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

/*
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only run on API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
*/