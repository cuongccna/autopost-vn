import { NextResponse } from 'next/server';
import { runScheduler } from '@/lib/scheduler';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await runScheduler(25);
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e?.message || String(e)
    }, { status: 500 });
  }
}