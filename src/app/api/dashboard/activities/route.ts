import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const actionType = searchParams.get('type'); // Filter by action type
    
    const offset = (page - 1) * limit;

    const supabase = sbServer(true); // Use service role

    // Build query with filters
    let query = supabase
      .from('autopostvn_system_activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Add type filter if provided
    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('Failed to fetch activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Format activities for display
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      type: activity.action_type,
      description: getActivityDescription(activity),
      timestamp: activity.created_at,
      metadata: activity.metadata
    })) || [];

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}

function getActivityDescription(activity: any): string {
  switch (activity.action_type) {
    case 'post_created':
      return `Tạo bài viết mới cho ${activity.metadata?.platform || 'platform'}`;
    case 'post_scheduled':
      return `Lập lịch đăng bài cho ${activity.metadata?.platform || 'platform'}`;
    case 'ai_usage':
      return `Sử dụng AI ${activity.metadata?.action_type || 'generation'} cho ${activity.metadata?.platform || 'platform'}`;
    case 'template_used':
      return `Sử dụng template "${activity.metadata?.template_name || 'Unknown'}"`;
    case 'platform_selected':
      return `Chọn platform ${activity.metadata?.platform || 'unknown'}`;
    default:
      return activity.description || 'Hoạt động không xác định';
  }
}
