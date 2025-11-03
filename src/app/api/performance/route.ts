import { NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/lib/services/performance-monitor.service';
import { CacheService } from '@/lib/services/cache.service';

export const runtime = 'nodejs';

/**
 * GET performance metrics và statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    
    let data: any;
    
    switch (type) {
      case 'summary':
        data = {
          performance: PerformanceMonitor.getSummary(),
          cache: CacheService.getStats()
        };
        break;
        
      case 'metrics':
        data = PerformanceMonitor.getGlobalStats();
        break;
        
      case 'transactions':
        const limit = parseInt(searchParams.get('limit') || '10');
        data = PerformanceMonitor.getRecentTransactions(limit);
        break;
        
      case 'cache':
        data = CacheService.getStats();
        break;
        
      default:
        return NextResponse.json({
          error: 'Invalid type. Use: summary, metrics, transactions, or cache'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error)
    }, { status: 500 });
  }
}

/**
 * POST để cleanup performance data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    
    switch (action) {
      case 'cleanup_performance':
        const olderThanMs = body.olderThanMs || 60 * 60 * 1000; // 1 hour default
        PerformanceMonitor.cleanup(olderThanMs);
        return NextResponse.json({
          success: true,
          message: 'Performance data cleaned up',
          timestamp: new Date().toISOString()
        });
        
      case 'cleanup_cache':
        CacheService.cleanup();
        return NextResponse.json({
          success: true,
          message: 'Cache cleaned up',
          timestamp: new Date().toISOString()
        });
        
      case 'invalidate_cache':
        const workspaceId = body.workspaceId;
        if (workspaceId) {
          CacheService.invalidateWorkspace(workspaceId);
        } else {
          CacheService.invalidateAll();
        }
        return NextResponse.json({
          success: true,
          message: workspaceId 
            ? `Cache invalidated for workspace: ${workspaceId}`
            : 'All cache invalidated',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid action. Use: cleanup_performance, cleanup_cache, or invalidate_cache'
        }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error in performance action:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
