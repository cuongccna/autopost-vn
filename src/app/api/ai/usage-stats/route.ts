import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAIUsageStats } from '@/lib/services/aiUsageService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    
    const stats = await getAIUsageStats(userId);
    
    if (!stats) {
      return NextResponse.json(
        { error: 'Could not retrieve usage stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats,
      success: true
    });

  } catch (error) {
    console.error('AI usage stats error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get AI usage stats' },
      { status: 500 }
    );
  }
}
