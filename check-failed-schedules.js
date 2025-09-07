const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailedSchedules() {
  try {
    console.log('=== Checking Failed Schedules ===');
    
    const { data: failed, error } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${failed?.length || 0} failed schedules:`);
    failed?.forEach(schedule => {
      console.log(`
Schedule ID: ${schedule.id}
Post ID: ${schedule.post_id}
Scheduled: ${schedule.scheduled_at}
Error: ${schedule.error_message || 'No error message'}
Retry Count: ${schedule.retry_count}
Updated: ${schedule.updated_at}
      `);
    });
    
    // Check scheduled_at that should have been processed
    console.log('\n=== Past Due Schedules Still Pending ===');
    const now = new Date().toISOString();
    
    const { data: pastDue, error: pastDueError } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .eq('status', 'pending')
      .lt('scheduled_at', now);
    
    if (pastDueError) {
      console.error('Error:', pastDueError);
      return;
    }
    
    console.log(`Found ${pastDue?.length || 0} past due pending schedules:`);
    pastDue?.forEach(schedule => {
      console.log(`- Schedule ${schedule.id} for post ${schedule.post_id} scheduled at ${schedule.scheduled_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFailedSchedules();
