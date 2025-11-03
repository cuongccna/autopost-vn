import { NextResponse } from 'next/server';
import { runOptimizedScheduler, cleanupSchedulerCache } from '@/lib/scheduler-optimized';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for long-running tasks

/**
 * ✅ OPTIMIZED Scheduler endpoint với parallel processing và caching
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const concurrency = parseInt(searchParams.get('concurrency') || '5');
    
    console.log(`🚀 [OPTIMIZED CRON] Starting with limit: ${limit}, concurrency: ${concurrency}`);
    
    const result = await runOptimizedScheduler(limit, concurrency);
    
    console.log(`✅ [OPTIMIZED CRON] Completed:`, result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      optimized: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ [OPTIMIZED CRON] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for manual trigger với custom parameters
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 20;
    const concurrency = body.concurrency || 5;
    
    console.log(`🚀 [OPTIMIZED MANUAL] Trigger with limit: ${limit}, concurrency: ${concurrency}`);
    
    const result = await runOptimizedScheduler(limit, concurrency);
    
    console.log(`✅ [OPTIMIZED MANUAL] Completed:`, result);
    
    return NextResponse.json({
      success: true,
      manual: true,
      timestamp: new Date().toISOString(),
      optimized: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ [OPTIMIZED MANUAL] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint để cleanup cache
 */
export async function DELETE(request: Request) {
  try {
    console.log('🧹 [OPTIMIZED CRON] Cleaning up cache');
    
    await cleanupSchedulerCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleaned up successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [OPTIMIZED CRON] Cleanup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
