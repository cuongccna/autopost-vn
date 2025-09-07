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

async function checkScheduleTables() {
  try {
    console.log('=== Checking Post Schedules Table ===');
    
    const { data: schedules, error: schedulesError } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .eq('status', 'pending')
      .lt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);
    
    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
    } else {
      console.log('Pending schedules found:', schedules?.length || 0);
      schedules?.forEach(schedule => {
        console.log(`Schedule ID: ${schedule.id}, Post ID: ${schedule.post_id}, Scheduled: ${schedule.scheduled_at}, Status: ${schedule.status}`);
      });
    }
    
    console.log('\n=== Checking All Schedules ===');
    const { data: allSchedules, error: allError } = await supabase
      .from('autopostvn_post_schedules')
      .select('*')
      .order('scheduled_at', { ascending: false })
      .limit(5);
    
    if (allError) {
      console.error('Error fetching all schedules:', allError);
    } else {
      console.log('Recent schedules:', allSchedules?.length || 0);
      allSchedules?.forEach(schedule => {
        console.log(`Schedule ID: ${schedule.id}, Post ID: ${schedule.post_id}, Scheduled: ${schedule.scheduled_at}, Status: ${schedule.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkScheduleTables();
