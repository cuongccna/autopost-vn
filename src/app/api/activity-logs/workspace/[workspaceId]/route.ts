import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogService } from '@/lib/services/activity-log.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/activity-logs/workspace/[workspaceId] - Lấy nhật ký workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = (session.user as any).id as string;
    const { workspaceId } = params;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }
    
    // TODO: Check if user has access to this workspace
    // For now, we assume they do
    
    const { searchParams } = new URL(request.url);
    
    const filters = {
      action_category: searchParams.get('action_category') as any,
      action_type: searchParams.get('action_type') || undefined,
      status: searchParams.get('status') as any,
      target_resource_type: searchParams.get('target_resource_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };
    
    const result = await ActivityLogService.getWorkspaceLogs(
      workspaceId,
      filters
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Workspace activity log fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
