import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = sbServer(true); // Use service role
    
    // Force update Free tier
    const { data: freeUpdate, error: freeError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .update({ 
        daily_limit: 3, 
        monthly_limit: 60,
        updated_at: new Date().toISOString()
      })
      .eq('user_role', 'free')
      .select();
    
    // Force update Professional tier  
    const { data: proUpdate, error: proError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .update({ 
        daily_limit: 50, 
        monthly_limit: 1000,
        updated_at: new Date().toISOString()
      })
      .eq('user_role', 'professional')
      .select();
    
    // Verify updates
    const { data: allLimits, error: queryError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*')
      .order('user_role');
    
    return NextResponse.json({
      success: true,
      updates: {
        free: { data: freeUpdate, error: freeError?.message },
        professional: { data: proUpdate, error: proError?.message },
        verification: { data: allLimits, error: queryError?.message }
      }
    });

  } catch (error) {
    console.error('Force update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to force update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
