import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateCaption } from '@/lib/services/gemini';
import { checkAIRateLimit, logAIUsage } from '@/lib/services/aiUsageService';

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = (session.user as any).id;
    const userRole = (session.user as any).user_role || 'free';
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Check AI rate limit before processing
    const rateLimitCheck = await checkAIRateLimit(userId, userRole);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      platform, 
      title, 
      content, 
      tone = 'exciting',
      targetAudience,
      productType 
    } = body;

    // Validation
    if (!platform || !title) {
      return NextResponse.json(
        { error: 'Platform and title are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['instagram', 'facebook', 'tiktok', 'zalo'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Allowed: ' + validPlatforms.join(', ') },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Generate caption using Gemini
    const caption = await generateCaption({
      platform: platform as 'instagram' | 'facebook' | 'tiktok' | 'zalo',
      title,
      content,
      tone: tone as 'professional' | 'casual' | 'exciting' | 'promotional',
      targetAudience,
      productType,
    });

    // Log successful AI usage
    await logAIUsage(userId, 'caption', true, 0);

    return NextResponse.json({ 
      caption,
      metadata: {
        platform,
        title,
        tone,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Caption generation error:', error);
    
    // Log failed AI usage
    if (userId) {
      await logAIUsage(userId, 'caption', false, 0, error instanceof Error ? error.message : 'Unknown error');
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
