import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMediaStats } from '@/lib/services/media-lifecycle.service';

/**
 * GET /api/media/stats - Get media storage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;

    const stats = await getMediaStats(userId, workspaceId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET media stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
