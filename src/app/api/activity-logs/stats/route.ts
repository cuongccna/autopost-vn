import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogService } from '@/lib/services/activity-log.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/activity-logs/stats - Lấy thống kê hoạt động của user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = (session.user as any).id as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id') || undefined;
    const days = parseInt(searchParams.get('days') || '30');
    
    const stats = await ActivityLogService.getActivityStats(
      userId,
      workspaceId,
      days
    );
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Activity stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
