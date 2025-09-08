import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAIRateLimit } from '@/lib/services/aiUsageService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).user_role || 'free';

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Check AI rate limit
    const rateLimitResult = await checkAIRateLimit(userId, userRole);

    return NextResponse.json(rateLimitResult);

  } catch (error) {
    console.error('AI rate limit check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check AI rate limit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
