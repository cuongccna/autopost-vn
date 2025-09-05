import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateHashtags } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      platform, 
      title, 
      content, 
      productType,
      targetAudience,
      count = 10 
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

    if (count < 1 || count > 30) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 30' },
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

    // Generate hashtags using Gemini
    const hashtags = await generateHashtags({
      platform: platform as 'instagram' | 'facebook' | 'tiktok' | 'zalo',
      title,
      content,
      productType,
      targetAudience,
      count,
    });

    return NextResponse.json({ 
      hashtags,
      metadata: {
        platform,
        title,
        count: hashtags.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Hashtags generation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate hashtags' },
      { status: 500 }
    );
  }
}
