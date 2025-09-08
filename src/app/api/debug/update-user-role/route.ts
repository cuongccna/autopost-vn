import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();
    if (!role || !['free', 'professional', 'enterprise'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const supabase = sbServer(true); // Use service role

    console.log(`🔄 Updating user ${userId} to role: ${role}`);

    // Update user role in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('autopostvn_users')
      .update({ user_role: role })
      .eq('id', userId)
      .select('id, email, user_role')
      .single();

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ User role updated:', updatedUser);

    // Test AI rate limit with new role
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: userId,
        p_user_role: role
      });

    console.log('📊 New AI Rate Limit Result:', rateLimitData);

    return NextResponse.json({
      success: true,
      updatedUser,
      newLimits: rateLimitData,
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: error },
      { status: 500 }
    );
  }
}
