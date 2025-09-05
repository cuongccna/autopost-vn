import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPostUsageStats, getPostUsageBreakdown } from '@/lib/services/postUsageService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get user role from URL params or default to 'free'
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get('role') || 'free';
    const includeBreakdown = searchParams.get('breakdown') === 'true';
    const days = parseInt(searchParams.get('days') || '30');

    // Get basic usage stats
    const stats = await getPostUsageStats(userId, userRole);
    
    const result: any = {
      stats,
      userId,
      timestamp: new Date().toISOString()
    };

    // Include breakdown if requested
    if (includeBreakdown) {
      const breakdown = await getPostUsageBreakdown(userId, days);
      result.breakdown = breakdown;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in post usage stats API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch post usage stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
