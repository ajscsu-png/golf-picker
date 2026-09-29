import { NextRequest, NextResponse } from 'next/server';
import { getField } from '@/lib/espn';

export async function GET(_req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const field = await getField(params.eventId);
  return NextResponse.json(field);
}
