import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = sbServer(true); // Use service role
    const testUserId = '59dd7dcb-73b3-4b83-96a6-82811c1413fe';
    
    // Check user role
    const { data: user, error: userError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('id', testUserId)
      .single();
    
    // Check AI rate limits
    const { data: limits, error: limitsError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*')
      .order('user_role');
    
    // Call database function directly
    const { data: funcResult, error: funcError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUserId,
        p_user_role: user?.user_role || 'free'
      });
    
    return NextResponse.json({
      success: true,
      debug: {
        user: user,
        userError: userError?.message,
        limits: limits,
        limitsError: limitsError?.message,
        functionResult: funcResult,
        functionError: funcError?.message
      },
      testUserId
    }, { status: 200 });

  } catch (error) {
    console.error('Debug error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to debug AI stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
