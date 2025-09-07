import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'autopostvn' }
  }
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('🚀 Creating test data for user:', userId);

    // 1. Create test social account (Facebook)
    const { data: socialAccount, error: accountError } = await supabase
      .from('social_accounts')
      .insert({
        user_id: userId,
        provider: 'facebook',
        username: 'test-facebook-account',
        display_name: 'Test Facebook Account', 
        status: 'connected',
        profile_data: {
          id: 'test_facebook_id',
          name: 'Test Facebook Account'
        },
        access_token: 'test_facebook_token_encrypted',
        token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      })
      .select()
      .single();

    if (accountError) {
      console.error('❌ Error creating social account:', accountError);
      return NextResponse.json({ error: 'Failed to create social account', details: accountError }, { status: 500 });
    }
    
    console.log('✅ Created social account:', socialAccount.id);

    // 2. Create test post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: 'Đây là bài test auto-posting lên Facebook! 🚀\\n\\nHệ thống AutoPost VN đang hoạt động tốt! #AutoPostVN #TestPost',
        media_url: null,
        platforms: ['facebook'],
        status: 'draft'
      })
      .select()
      .single();

    if (postError) {
      console.error('❌ Error creating post:', postError);
      return NextResponse.json({ error: 'Failed to create post', details: postError }, { status: 500 });
    }
    
    console.log('✅ Created post:', post.id);

    // 3. Create schedule (5 minutes from now)
    const scheduledTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        post_id: post.id,
        social_account_id: socialAccount.id,
        platform: 'facebook',
        scheduled_time: scheduledTime.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating schedule:', scheduleError);
      return NextResponse.json({ error: 'Failed to create schedule', details: scheduleError }, { status: 500 });
    }
    
    console.log('✅ Created schedule:', schedule.id);
    console.log(`⏰ Scheduled for: ${scheduledTime.toLocaleString()}`);

    // 4. Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'test_data_created',
        details: {
          post_id: post.id,
          schedule_id: schedule.id,
          social_account_id: socialAccount.id,
          scheduled_time: scheduledTime.toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully!',
      data: {
        post_id: post.id,
        schedule_id: schedule.id,
        social_account_id: socialAccount.id,
        scheduled_time: scheduledTime.toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating test data:', error);
    return NextResponse.json({ 
      error: 'Failed to create test data', 
      details: error.message 
    }, { status: 500 });
  }
}
