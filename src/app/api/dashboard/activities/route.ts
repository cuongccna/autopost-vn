import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

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

    // Build query with filters
    let sqlQuery = `
      SELECT * FROM autopostvn_system_activity_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add type filter if provided
    if (actionType && actionType !== 'all') {
      sqlQuery += ` AND action_type = $${paramIndex}`;
      params.push(actionType);
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = sqlQuery.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Add ordering and pagination
    sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    const activities = result.rows;

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.action_type,
      description: getActivityDescription(activity),
      timestamp: activity.created_at,
      metadata: activity.additional_data
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
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
