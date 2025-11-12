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

    console.log('🧹 Starting media cleanup...');

    // Clean up media for all user roles
    const results = await Promise.all([
      cleanupMediaByUserRole('free'),
      cleanupMediaByUserRole('pro'),
      cleanupMediaByUserRole('enterprise')
    ]);

    const totalArchived = results.reduce((sum, result) => sum + result.archived, 0);
    const totalDeleted = results.reduce((sum, result) => sum + result.deleted, 0);

    console.log(`✅ Media cleanup completed: ${totalArchived} archived, ${totalDeleted} deleted`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalArchived,
      totalDeleted,
      results
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
