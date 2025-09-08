import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAIUsageStats } from '@/lib/services/aiUsageService';

export async function GET(request: NextRequest) {
  try {
    console.log('=== REAL USER DEBUG START ===');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', !!session, session?.user ? 'has user' : 'no user');
    
    if (!session?.user) {
      console.log('Not authenticated');
      return NextResponse.json({ error: 'Not authenticated, please login first' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    console.log('User ID:', userId);
    
    // Get stats using the same method as the real API
    const stats = await getAIUsageStats(userId);
    console.log('AI Usage Stats:', JSON.stringify(stats, null, 2));
    
    const result = {
      success: true,
      userId,
      sessionUser: {
        email: session.user.email,
        name: session.user.name,
        id: (session.user as any).id
      },
      stats,
      debug: {
        userIdSource: (session.user as any).id ? 'user.id' : 'user.email',
        sessionKeys: Object.keys(session.user)
      }
    };
    
    console.log('=== REAL USER DEBUG END ===');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Real user debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
