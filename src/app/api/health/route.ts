import { NextResponse } from 'next/server';

// Легкий healthcheck для Docker: не залежить від БД, тож падіння Mongo не перезапускає застосунок.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
