import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';
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

    const supabase = sbServer(true); // Use service role

    // Get total posts count
    const { count: totalPosts } = await supabase
      .from('autopostvn_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get posts published today
    const today = new Date().toISOString().split('T')[0];
    const { count: publishedToday } = await supabase
      .from('autopostvn_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59');

    // Get connected social accounts (use exact same logic as /api/user/accounts)
    const userSocialAccounts = await userManagementService.getUserSocialAccounts(session.user.email!);
    console.log('🔗 Social accounts found via UserManagementService:', userSocialAccounts?.length || 0, userSocialAccounts);
    const connectedAccounts = userSocialAccounts?.length || 0;

    // Get scheduled posts count using actual user's social accounts
    const userAccountIds = userSocialAccounts?.map(acc => acc.id) || [];
    console.log('📅 User account IDs for schedules (from UserManagementService):', userAccountIds);

    // Debug: Check all schedules in database
    const { data: allSchedules } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('🔍 All pending schedules in DB:', allSchedules);

    const { count: scheduledPosts } = userAccountIds.length > 0 ? await supabase
      .from('autopostvn_post_schedules')
      .select('*', { count: 'exact', head: true })
      .in('social_account_id', userAccountIds)
      .eq('status', 'pending') : { count: 0 };

    console.log('📅 Scheduled posts found:', scheduledPosts);

    console.log('📊 Dashboard stats:', {
      totalPosts: totalPosts || 0,
      scheduledPosts: scheduledPosts || 0,
      publishedToday: publishedToday || 0,
      connectedAccounts: connectedAccounts || 0
    });

    return NextResponse.json({
      totalPosts: totalPosts || 0,
      scheduledPosts: scheduledPosts || 0,
      publishedToday: publishedToday || 0,
      connectedAccounts: connectedAccounts || 0
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
