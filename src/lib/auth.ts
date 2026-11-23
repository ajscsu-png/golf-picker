import { createHash, timingSafeEqual } from 'node:crypto';

/** Constant-time string comparison (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Fail closed: an unset/empty expected secret never authorizes anyone. */
export function isValidSecret(candidate: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected || !candidate) return false;
  return safeEqual(candidate, expected);
}

export function parseBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

export function isCronAuthorized(authHeader: string | null | undefined, secret = process.env.CRON_SECRET): boolean {
  return isValidSecret(parseBearer(authHeader), secret);
}

export function isAdminRequest(
  cookieToken: string | null | undefined,
  authHeader: string | null | undefined,
  adminToken = process.env.ADMIN_TOKEN
): boolean {
  return isValidSecret(cookieToken, adminToken) || isValidSecret(parseBearer(authHeader), adminToken);
}
