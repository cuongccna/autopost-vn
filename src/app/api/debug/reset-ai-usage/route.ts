import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = sbServer(true); // Use service role
    const testUserId = '59dd7dcb-73b3-4b83-96a6-82811c1413fe';
    
    // Reset daily AI usage for testing
    const { data: resetData, error: resetError } = await supabase
      .from('autopostvn_ai_usage')
      .delete()
      .eq('user_id', testUserId)
      .gte('created_at', new Date().toISOString().split('T')[0]); // Today's records
    
    // Verify reset
    const { data: verifyData, error: verifyError } = await supabase
      .from('autopostvn_ai_usage')
      .select('*')
      .eq('user_id', testUserId)
      .gte('created_at', new Date().toISOString().split('T')[0]);
    
    return NextResponse.json({
      success: true,
      reset: {
        data: resetData,
        error: resetError?.message
      },
      verification: {
        remaining_records: verifyData?.length || 0,
        error: verifyError?.message
      },
      message: 'AI usage reset for today'
    });

  } catch (error) {
    console.error('Reset AI usage error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to reset AI usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
