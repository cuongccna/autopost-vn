import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = sbServer(true);

    // Test với user Professional (sử dụng UUID format thật)
    const testUserId = '12345678-1234-5678-9012-123456789012'; // Valid UUID format
    const testUserRole = 'professional';

    console.log('Testing with:', { testUserId, testUserRole });

    // 1. Kiểm tra rate limits table
    const { data: rateLimits, error: rateError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*');

    if (rateError) {
      console.error('Rate limits error:', rateError);
      return NextResponse.json({ error: 'Rate limits error', details: rateError });
    }

    // 2. Kiểm tra function check_ai_rate_limit
    const { data: functionResult, error: funcError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUserId,
        p_user_role: testUserRole
      });

    if (funcError) {
      console.error('Function error:', funcError);
      return NextResponse.json({ error: 'Function error', details: funcError });
    }

    // 3. Kiểm tra users table
    const { data: users, error: usersError } = await supabase
      .from('autopostvn_users')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      rateLimits,
      functionResult,
      users: users?.length || 0,
      testInfo: { testUserId, testUserRole },
      debug: {
        professionalLimits: rateLimits?.find(r => r.user_role === 'professional'),
        functionDetails: functionResult
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 });
  }
}
