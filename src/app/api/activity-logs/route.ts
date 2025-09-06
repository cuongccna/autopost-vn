import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogService } from '@/lib/services/activity-log.service';
import { CreateActivityLogRequest } from '@/types/activity-logs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/activity-logs - Tạo nhật ký hoạt động mới
export async function POST(request: NextRequest) {
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
    
    const body: CreateActivityLogRequest = await request.json();
    
    // Validate required fields
    if (!body.action_type || !body.action_category) {
      return NextResponse.json(
        { error: 'action_type and action_category are required' },
        { status: 400 }
      );
    }
    
    // Extract request context
    const context = {
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestId: crypto.randomUUID(),
      sessionId: userId,
    };
    
    const log = await ActivityLogService.log(
      userId,
      body,
      context
    );
    
    if (!log) {
      return NextResponse.json(
        { error: 'Failed to create activity log' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(log);
  } catch (error) {
    console.error('Activity log creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/activity-logs - Lấy nhật ký hoạt động của user
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
    
    const result = await ActivityLogService.getUserLogs(
      userId,
      filters
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Activity log fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
