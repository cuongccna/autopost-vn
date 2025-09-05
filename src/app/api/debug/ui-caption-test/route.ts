import { NextRequest, NextResponse } from 'next/server';
import { generateCaption } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: UI Caption endpoint called with REAL AI');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    // Use real AI service
    const { title, platform, tone, content } = body;
    
    console.log('🤖 Calling REAL AI with:', {
      title,
      platform,
      tone,
      content: content || ''
    });
    
    const aiResponse = await generateCaption({
      title,
      platform,
      tone: tone || 'exciting',
      content: content || ''
    });
    
    console.log('✅ Real AI Response:', aiResponse.substring(0, 100) + '...');
    
    const response = {
      caption: aiResponse,
      debug: {
        input: body,
        timestamp: new Date().toISOString(),
        note: 'Real AI response for UI testing',
        aiUsed: true
      }
    };
    
    console.log('📤 Sending to UI:', { ...response, caption: response.caption.substring(0, 100) + '...' });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Real AI caption error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI service failed' },
      { status: 500 }
    );
  }
}
