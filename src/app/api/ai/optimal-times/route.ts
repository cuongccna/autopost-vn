import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { suggestOptimalTimes } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Optimal times API called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const { 
      platforms, 
      contentType = 'promotional', 
      targetAudience = 'general',
      timezone = 'Asia/Ho_Chi_Minh'
    } = body;

    // Validation
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Platforms array is required and must not be empty' },
        { status: 400 }
      );
    }

    const validPlatforms = ['instagram', 'facebook', 'tiktok', 'zalo', 'youtube'];
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Invalid platforms: ${invalidPlatforms.join(', ')}. Allowed: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const validContentTypes = ['promotional', 'educational', 'entertainment', 'news'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Allowed: ' + validContentTypes.join(', ') },
        { status: 400 }
      );
    }

    const validAudiences = ['teens', 'adults', 'professionals', 'general'];
    if (!validAudiences.includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid target audience. Allowed: ' + validAudiences.join(', ') },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ Gemini API key not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.log('🤖 Calling Gemini suggestOptimalTimes with params:', {
      platform: platforms,
      contentType,
      targetAudience,
      timezone
    });

    // Generate optimal times suggestions using Gemini
    const suggestions = await suggestOptimalTimes({
      platform: platforms,
      contentType: contentType as 'promotional' | 'educational' | 'entertainment' | 'news',
      targetAudience: targetAudience as 'teens' | 'adults' | 'professionals' | 'general',
      timezone,
    });

    console.log('✅ Gemini response received:', suggestions);

    return NextResponse.json({ 
      suggestions: suggestions.suggestions,
      metadata: {
        platforms,
        contentType,
        targetAudience,
        timezone,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Optimal times suggestion error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error
    });
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to suggest optimal times' },
      { status: 500 }
    );
  }
}
