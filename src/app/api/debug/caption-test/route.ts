import { NextRequest, NextResponse } from 'next/server';
import { generateCaption } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      platform = 'instagram', 
      title, 
      content, 
      tone = 'exciting',
      targetAudience = 'general',
      productType = 'general' 
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    console.log('DEBUG: Generating caption with params:', {
      platform, title, content, tone, targetAudience, productType
    });

    // Generate caption using Gemini
    const caption = await generateCaption({
      platform: platform as 'instagram' | 'facebook' | 'tiktok' | 'zalo',
      title,
      content,
      tone: tone as 'professional' | 'casual' | 'exciting' | 'promotional',
      targetAudience,
      productType,
    });

    console.log('DEBUG: Generated caption:', caption);

    return NextResponse.json({ 
      caption,
      debug: {
        input: { platform, title, content, tone, targetAudience, productType },
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Caption generation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, stack: error.stack },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
