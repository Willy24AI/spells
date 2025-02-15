import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes that require authentication
  if (!session && req.nextUrl.pathname.startsWith('/profile')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/api/stats/:path*',
    '/api/rankings/:path*',
    '/admin/:path*',
    '/api/puzzle/generate/:path*',
    '/api/puzzle/schedule/:path*',
    '/api/puzzle/quality/:path*',
    '/api/dictionary/:path*'
  ],
};