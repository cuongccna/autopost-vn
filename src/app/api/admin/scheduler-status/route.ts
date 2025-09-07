import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = sbServer(true);
    const now = new Date().toISOString();
    
    // Check pending schedules
    const { data: pendingSchedules, error: pendingError } = await supabase
      .from('autopostvn_post_schedules')
      .select('id, post_id, scheduled_at, retry_count')
      .eq('status', 'pending')
      .lt('scheduled_at', now)
      .order('scheduled_at', { ascending: true });
    
    if (pendingError) {
      throw pendingError;
    }
    
    // Check recent activity (last 24 hours)
    const last24h = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: recentActivity, error: recentError } = await supabase
      .from('autopostvn_post_schedules')
      .select('id, post_id, status, scheduled_at, updated_at, error_message')
      .gte('updated_at', last24h)
      .in('status', ['completed', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(20);
    
    if (recentError) {
      throw recentError;
    }
    
    // Get total counts
    const { data: statusCounts } = await supabase
      .from('autopostvn_post_schedules')
      .select('status')
      .gte('created_at', last24h);
    
    const stats = {
      pending: statusCounts?.filter(s => s.status === 'pending').length || 0,
      completed: statusCounts?.filter(s => s.status === 'completed').length || 0,
      failed: statusCounts?.filter(s => s.status === 'failed').length || 0
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: now,
      pendingOverdue: pendingSchedules?.length || 0,
      pendingSchedules: pendingSchedules || [],
      recentActivity: recentActivity || [],
      stats24h: stats,
      lastCheck: now
    });
    
  } catch (error) {
    console.error('Scheduler status check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: String(error)
    }, { status: 500 });
  }
}
