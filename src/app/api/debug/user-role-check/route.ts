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
    const userEmail = session.user.email;
    
    console.log('🎯 Debug session user:', { userId, userEmail });

    const supabase = sbServer(true); // Use service role

    // Check user in autopostvn_users table
    const { data: userData, error: userError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('id', userId)
      .single();

    console.log('👤 User data from DB:', userData);
    
    if (userError) {
      console.log('❌ User error:', userError);
    }

    // Test AI rate limit function
    const userRole = userData?.user_role || 'free';
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: userId,
        p_user_role: userRole
      });

    console.log('📊 AI Rate Limit Result:', rateLimitData);
    
    if (rateLimitError) {
      console.log('❌ Rate limit error:', rateLimitError);
    }

    return NextResponse.json({
      session: {
        userId,
        userEmail,
        userRole: (session.user as any).role
      },
      database: {
        userData,
        userError: userError?.message
      },
      rateLimit: {
        data: rateLimitData,
        error: rateLimitError?.message
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}
