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

    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    console.log('🔄 Force refreshing AI usage stats for user:', { userId, userEmail });

    const supabase = sbServer(true); // Use service role

    // 1. Get current user data from database
    const { data: userData, error: userError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('id', userId)
      .single();

    console.log('👤 Current user data:', userData);

    if (userError || !userData) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: userError 
      }, { status: 404 });
    }

    // 2. Call the AI rate limit function directly with current user role
    const { data: freshStats, error: statsError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: userId,
        p_user_role: userData.user_role
      });

    console.log('📊 Fresh AI stats from function:', freshStats);

    if (statsError) {
      console.error('❌ Stats error:', statsError);
      return NextResponse.json({ 
        error: 'Failed to get fresh stats', 
        details: statsError 
      }, { status: 500 });
    }

    // 3. Also check raw usage data
    const { data: dailyUsage, error: dailyError } = await supabase
      .from('autopostvn_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('request_date', new Date().toISOString().split('T')[0])
      .eq('success', true);

    const { data: monthlyUsage, error: monthlyError } = await supabase
      .from('autopostvn_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('request_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .eq('success', true);

    console.log('📈 Raw usage data:', {
      dailyCount: dailyUsage?.length || 0,
      monthlyCount: monthlyUsage?.length || 0
    });

    return NextResponse.json({
      success: true,
      userData,
      freshStats,
      rawUsage: {
        dailyCount: dailyUsage?.length || 0,
        monthlyCount: monthlyUsage?.length || 0,
        dailyRecords: dailyUsage || [],
        monthlyRecords: monthlyUsage || []
      },
      message: 'AI usage stats refreshed successfully'
    });

  } catch (error) {
    console.error('💥 Force refresh error:', error);
    return NextResponse.json(
      { error: 'Refresh failed', details: error },
      { status: 500 }
    );
  }
}
