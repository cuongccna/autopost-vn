// Check schedule details
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchedule() {
  try {
    console.log('🔍 Checking latest schedule...\n');

    // Get latest schedule
    const { data: schedule, error } = await supabase
      .from('autopostvn_post_schedules')
      .select(`
        id,
        post_id,
        social_account_id,
        scheduled_at,
        status
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📅 Latest Schedule:');
    console.log('  ID:', schedule.id);
    console.log('  Post ID:', schedule.post_id);
    console.log('  Account ID:', schedule.social_account_id);
    console.log('  Status:', schedule.status);
    console.log('  Scheduled at:', schedule.scheduled_at);
    
    // Get account details
    const { data: account, error: accError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('id', schedule.social_account_id)
      .single();

    if (accError) {
      console.error('❌ Account error:', accError);
      return;
    }

    console.log('\n📱 Social Account:');
    console.log('  Name:', account.name);
    console.log('  Provider:', account.provider);  // ← KEY INFO!
    console.log('  Provider ID:', account.provider_id);
    console.log('  Token Type:', account.metadata?.tokenType);
    
    if (account.provider === 'facebook') {
      console.log('\n❌ PROBLEM: Schedule is using USER account (provider=facebook)');
      console.log('   Should use PAGE account (provider=facebook_page)');
    } else if (account.provider === 'facebook_page') {
      console.log('\n✅ CORRECT: Schedule is using PAGE account');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSchedule();
