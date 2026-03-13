import { NextRequest, NextResponse } from 'next/server';
import { setConfig } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }

  await setConfig(key, value);
  return NextResponse.json({ ok: true });
}
