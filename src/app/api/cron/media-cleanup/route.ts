import { NextRequest, NextResponse } from 'next/server';
import { cleanupMediaByUserRole, LIFECYCLE_POLICIES } from '@/lib/services/media-lifecycle.service';

/**
 * GET /api/cron/media-cleanup - Auto cleanup old media
 * Should be triggered by Vercel Cron or external scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Starting media cleanup job...');

    const results = {
      free: await cleanupMediaByUserRole('free'),
      professional: await cleanupMediaByUserRole('professional'),
      enterprise: await cleanupMediaByUserRole('enterprise'),
    };

    const totalArchived = results.free.archivedCount + results.professional.archivedCount + results.enterprise.archivedCount;
    const totalDeleted = results.free.deletedCount + results.professional.deletedCount + results.enterprise.deletedCount;

    console.log(`✅ Cleanup complete: ${totalArchived} archived, ${totalDeleted} deleted`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalArchived,
        totalDeleted,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Media cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/media-cleanup - Manual trigger (for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
