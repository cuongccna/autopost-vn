import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/postgres';
import { userManagementService } from '@/lib/services/UserManagementService';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Dashboard stats API called');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 User session:', session.user.email);
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get total posts count
    const totalPostsResult = await query(
      'SELECT COUNT(*) as count FROM autopostvn_posts WHERE user_id = $1',
      [userId]
    );
    const totalPosts = parseInt(totalPostsResult.rows[0]?.count || '0');

    // Get posts published today
    const today = new Date().toISOString().split('T')[0];
    const publishedTodayResult = await query(
      `SELECT COUNT(*) as count FROM autopostvn_posts 
       WHERE user_id = $1 
       AND created_at >= $2::date 
       AND created_at < ($2::date + interval '1 day')`,
      [userId, today]
    );
    const publishedToday = parseInt(publishedTodayResult.rows[0]?.count || '0');

    // Get connected social accounts
    const userSocialAccounts = await userManagementService.getUserSocialAccounts(session.user.email!);
    console.log('🔗 Social accounts found via UserManagementService:', userSocialAccounts?.length || 0);
    const connectedAccounts = userSocialAccounts?.length || 0;

    // Get scheduled posts count using actual user's social accounts
    const userAccountIds = userSocialAccounts?.map(acc => acc.id) || [];
    console.log('📅 User account IDs for schedules:', userAccountIds);

    let scheduledPosts = 0;
    if (userAccountIds.length > 0) {
      const scheduledResult = await query(
        `SELECT COUNT(*) as count FROM autopostvn_post_schedules 
         WHERE social_account_id = ANY($1) AND status = 'pending'`,
        [userAccountIds]
      );
      scheduledPosts = parseInt(scheduledResult.rows[0]?.count || '0');
    }

    console.log('📅 Scheduled posts found:', scheduledPosts);

    console.log('📊 Dashboard stats:', {
      totalPosts,
      scheduledPosts,
      publishedToday,
      connectedAccounts
    });

    return NextResponse.json({
      totalPosts,
      scheduledPosts,
      publishedToday,
      connectedAccounts
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
