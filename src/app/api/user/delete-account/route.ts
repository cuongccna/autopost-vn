import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await request.json();
    const { confirmEmail } = body;

    // Security check: require email confirmation
    if (confirmEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    const supabase = sbServer(true);

    console.log('🗑️  Starting account deletion for user:', userId);

    // Get user's workspaces
    const { data: workspaces } = await supabase
      .from('autopostvn_workspaces')
      .select('id')
      .eq('created_by', userId);

    const workspaceIds = workspaces?.map(w => w.id) || [];

    // Delete all related data in order (respecting foreign keys)
    const deletionSteps = [];

    // 1. Delete activity logs
    if (workspaceIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('autopostvn_activity_logs')
          .delete()
          .in('workspace_id', workspaceIds)
      );
    }

    // 2. Delete scheduled posts
    if (workspaceIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('autopostvn_scheduled_posts')
          .delete()
          .in('workspace_id', workspaceIds)
      );
    }

    // 3. Delete social accounts
    deletionSteps.push(
      supabase
        .from('autopostvn_user_social_accounts')
        .delete()
        .eq('user_id', userId)
    );

    // 4. Delete AI usage records
    deletionSteps.push(
      supabase
        .from('autopostvn_ai_usage')
        .delete()
        .eq('user_id', userId)
    );

    // 5. Delete workspaces
    if (workspaceIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('autopostvn_workspaces')
          .delete()
          .in('id', workspaceIds)
      );
    }

    // 6. Delete user record
    deletionSteps.push(
      supabase
        .from('autopostvn_users')
        .delete()
        .eq('id', userId)
    );

    // Execute all deletions
    await Promise.all(deletionSteps);

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue anyway, user data is already deleted
    }

    console.log('✅ Account deleted successfully:', userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
