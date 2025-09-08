import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = sbServer(true); // Use service role

    console.log('🔍 Debugging AI limits system...');

    // 1. Check AI rate limits table
    const { data: limits, error: limitsError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*')
      .order('user_role');

    console.log('📊 AI Rate Limits Table:', limits);
    if (limitsError) console.error('❌ Limits Error:', limitsError);

    // 2. Check all users
    const { data: users, error: usersError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('👥 Recent Users:', users);
    if (usersError) console.error('❌ Users Error:', usersError);

    // 3. Force update first user to professional for testing
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`🎯 Testing with user: ${testUser.email} (${testUser.id})`);

      // Update to professional
      const { data: updatedUser, error: updateError } = await supabase
        .from('autopostvn_users')
        .update({ user_role: 'professional' })
        .eq('id', testUser.id)
        .select()
        .single();

      console.log('✅ Updated user to professional:', updatedUser);
      if (updateError) console.error('❌ Update Error:', updateError);

      // 4. Test the function directly
      const { data: functionResult, error: functionError } = await supabase
        .rpc('check_ai_rate_limit', {
          p_user_id: testUser.id,
          p_user_role: 'professional'
        });

      console.log('🧪 Function Result:', functionResult);
      if (functionError) console.error('❌ Function Error:', functionError);

      return NextResponse.json({
        success: true,
        limits,
        users,
        updatedUser,
        functionResult,
        errors: {
          limitsError: limitsError ? String((limitsError as any)?.message || limitsError) : null,
          usersError: usersError ? String((usersError as any)?.message || usersError) : null,
          updateError: updateError ? String((updateError as any)?.message || updateError) : null,
          functionError: functionError ? String((functionError as any)?.message || functionError) : null
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No users found for testing',
      limits,
      users
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}
