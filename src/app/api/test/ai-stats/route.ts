import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Real test user ID that exists in database
    const testUserId = '59dd7dcb-73b3-4b83-96a6-82811c1413fe';
    
    console.log('Testing AI stats for user:', testUserId);
    
    // Import the function we want to test
    const { getAIUsageStats } = await import('@/lib/services/aiUsageService');
    
    console.log('Calling getAIUsageStats...');
    const stats = await getAIUsageStats(testUserId);
    
    console.log('AI Stats result:', stats);
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Test endpoint for AI usage stats',
      testUserId
    });

  } catch (error) {
    console.error('Test AI stats error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to test AI usage stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
