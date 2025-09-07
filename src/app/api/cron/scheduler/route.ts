import { NextResponse } from 'next/server';
import { runScheduler } from '@/lib/scheduler';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Lấy limit từ query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log(`🚀 [CRON] Starting scheduler with limit: ${limit}`);
    
    const result = await runScheduler(limit);
    
    console.log(`✅ [CRON] Scheduler completed:`, result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ [CRON] Scheduler error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST endpoint để manual trigger
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10;
    
    console.log(`🚀 [MANUAL] Manual scheduler trigger with limit: ${limit}`);
    
    const result = await runScheduler(limit);
    
    console.log(`✅ [MANUAL] Manual scheduler completed:`, result);
    
    return NextResponse.json({
      success: true,
      manual: true,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ [MANUAL] Manual scheduler error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}