import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'

// GET /api/debug/check-user-limits - Check user role and current usage
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id;
    const supabase = sbServer(true); // Use service role

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    // Get today's post usage
    const today = new Date().toISOString().split('T')[0];
    const { data: todayUsage, error: usageError } = await supabase
      .from('autopostvn_post_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z');

    // Get rate limit check result
    const { data: rateLimitResult, error: rpcError } = await supabase
      .rpc('check_post_rate_limit', {
        p_user_id: userId,
        p_user_role: userData?.role || 'free'
      });

    return NextResponse.json({ 
      user: {
        id: userId,
        email: userData?.email,
        name: userData?.name,
        role: userData?.role || 'free (default)'
      },
      todayUsage: {
        count: todayUsage?.length || 0,
        posts: todayUsage || []
      },
      rateLimitCheck: rateLimitResult,
      errors: {
        userError: userError?.message,
        usageError: usageError?.message,
        rpcError: rpcError?.message
      }
    });

  } catch (error) {
    console.error('Check user limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
