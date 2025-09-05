import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateVideoScript } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      platform, 
      duration, 
      title, 
      content, 
      style = 'promotional' 
    } = body;

    // Validation
    if (!platform || !duration || !title) {
      return NextResponse.json(
        { error: 'Platform, duration and title are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['tiktok', 'youtube', 'instagram'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Allowed: ' + validPlatforms.join(', ') },
        { status: 400 }
      );
    }

    if (duration < 5 || duration > 300) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 300 seconds' },
        { status: 400 }
      );
    }

    const validStyles = ['educational', 'entertainment', 'promotional', 'storytelling'];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style. Allowed: ' + validStyles.join(', ') },
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

    // Generate video script using Gemini
    const script = await generateVideoScript({
      platform: platform as 'tiktok' | 'youtube' | 'instagram',
      duration,
      title,
      content,
      style: style as 'educational' | 'entertainment' | 'promotional' | 'storytelling',
    });

    return NextResponse.json({ 
      script,
      metadata: {
        platform,
        duration,
        title,
        style,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Video script generation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate video script' },
      { status: 500 }
    );
  }
}
