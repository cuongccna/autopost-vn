import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'

// GET method for easier testing in browser
export async function GET(request: NextRequest) {
  return POST(request);
}

// POST /api/debug/reset-post-usage - Reset post usage limits for development
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

    // Reset post usage limits
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
      }, {
        onConflict: 'user_id'
      });

    if (resetError) {
      console.error('Error resetting post usage limits:', resetError);
      return NextResponse.json({ error: 'Failed to reset post usage limits' }, { status: 500 });
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('autopostvn_post_limits_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ 
      message: 'Post usage limits reset successfully',
      stats 
    });

  } catch (error) {
    console.error('Reset post usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
