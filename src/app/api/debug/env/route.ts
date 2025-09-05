import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Mask the URL for security but show enough to identify environment
    const maskedUrl = supabaseUrl 
      ? supabaseUrl.substring(0, 8) + '***' + supabaseUrl.substring(supabaseUrl.length - 20)
      : 'NOT_SET';
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: maskedUrl,
        hasServiceKey,
        hasAnonKey,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Env debug error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to debug environment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
