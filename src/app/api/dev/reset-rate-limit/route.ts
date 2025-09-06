import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'

// POST /api/dev/reset-rate-limit - Reset rate limits for development
export async function POST(request: NextRequest) {
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

    // Reset rate limits
    const { error: resetError } = await supabase
      .from('autopostvn_post_limits_tracking')
      .upsert({
        user_id: userId,
        monthly_posts: 0,
        weekly_posts: 0,
        daily_posts: 0,
        monthly_limit: 100,
        user_role: 'premium',
        last_reset_at: new Date().toISOString()
      });

    if (resetError) {
      console.error('Error resetting rate limits:', resetError);
      return NextResponse.json({ error: 'Failed to reset rate limits' }, { status: 500 });
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('autopostvn_post_limits_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ 
      message: 'Rate limits reset successfully',
      stats 
    });

  } catch (error) {
    console.error('Reset rate limit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
