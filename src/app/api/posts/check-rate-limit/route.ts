import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkPostRateLimit } from '@/lib/services/postUsageService'
import { sbServer } from '@/lib/supabase/server'

// GET /api/posts/check-rate-limit - Check if user can create a new post
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id;

    // Get user's role from session (already loaded from auth.users)
    const userRole = (session.user as any).role || 'free';
    console.log(`Rate limit check for user ${userId} with role: ${userRole}`);

    // Check post rate limit
    const rateLimitCheck = await checkPostRateLimit(userId, userRole);
    
    return NextResponse.json({
      allowed: rateLimitCheck.allowed,
      stats: rateLimitCheck.stats,
      message: rateLimitCheck.message,
      userRole
    });

  } catch (error) {
    console.error('Check rate limit error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
