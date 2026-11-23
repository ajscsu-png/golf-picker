import { NextRequest, NextResponse } from 'next/server';

// Edge runtime: no node:crypto, so use a constant-time loop compare.
function tokenMatches(candidate: string | undefined, expected: string | undefined): boolean {
  if (!expected || !candidate) return false; // fail closed when ADMIN_TOKEN is unset
  const len = Math.max(candidate.length, expected.length);
  let diff = candidate.length ^ expected.length;
  for (let i = 0; i < len; i++) {
    diff |= (candidate.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and auth API through
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value;
    if (!tokenMatches(token, process.env.ADMIN_TOKEN)) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
