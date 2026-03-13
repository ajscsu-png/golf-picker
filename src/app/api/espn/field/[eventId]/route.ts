import { NextRequest, NextResponse } from 'next/server';
import { getField } from '@/lib/espn';

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const field = await getField(params.eventId);
  return NextResponse.json(field);
}
