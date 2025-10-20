// Delete old Facebook accounts
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteOldFacebookAccounts() {
  try {
    console.log('🗑️  Deleting old Facebook accounts...\n');

    const { data, error } = await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .eq('provider', 'facebook')
      .select();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ Deleted ${data.length} accounts:`);
    data.forEach(acc => {
      console.log(`  - ${acc.name} (ID: ${acc.provider_id})`);
    });

    console.log('\n✅ Done! Now reconnect Facebook with Pages permissions.');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

deleteOldFacebookAccounts();
