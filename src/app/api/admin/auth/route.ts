import { NextRequest, NextResponse } from 'next/server';
import { isValidSecret } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_TOKEN || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Admin auth not configured' }, { status: 503 });
  }

  if (typeof password !== 'string' || !isValidSecret(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', process.env.ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_token');
  return res;
}
