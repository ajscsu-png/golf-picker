import { NextRequest, NextResponse } from 'next/server.js';
import { isAdminRequest } from './auth.ts';

/**
 * Returns a 401 response when the request is not an authenticated admin, else null.
 * Usage: `const denied = requireAdmin(req); if (denied) return denied;`
 * Fails closed when ADMIN_TOKEN is unset or empty.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const ok = isAdminRequest(req.cookies.get('admin_token')?.value, req.headers.get('authorization'));
  return ok ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
