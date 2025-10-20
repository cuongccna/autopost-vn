// Check Facebook Pages in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacebookPages() {
  try {
    console.log('🔍 Checking for Facebook Pages...\n');

    // Check all providers
    const { data: allAccounts, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('provider, provider_id, name, metadata, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`Total accounts: ${allAccounts.length}\n`);

    // Group by provider
    const grouped = {};
    allAccounts.forEach(acc => {
      if (!grouped[acc.provider]) grouped[acc.provider] = [];
      grouped[acc.provider].push(acc);
    });

    for (const [provider, accounts] of Object.entries(grouped)) {
      console.log(`\n📱 Provider: ${provider} (${accounts.length} accounts)`);
      console.log('─'.repeat(60));
      
      accounts.forEach((acc, idx) => {
        console.log(`\n${idx + 1}. ${acc.name || acc.metadata?.name || 'No name'}`);
        console.log(`   ID: ${acc.provider_id}`);
        console.log(`   Created: ${new Date(acc.created_at).toLocaleString()}`);
        if (acc.metadata) {
          console.log(`   Metadata:`);
          if (acc.metadata.tokenType) console.log(`     - Token Type: ${acc.metadata.tokenType}`);
          if (acc.metadata.category) console.log(`     - Category: ${acc.metadata.category}`);
          if (acc.metadata.page) console.log(`     - Has Page Data: ✅`);
        }
      });
    }

    // Specifically check for facebook_page provider
    const { data: pageAccounts, error: pageError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('provider', 'facebook_page');

    console.log(`\n\n🎯 Facebook Page accounts (provider='facebook_page'): ${pageAccounts?.length || 0}`);
    if (pageAccounts && pageAccounts.length > 0) {
      pageAccounts.forEach(page => {
        console.log(`  ✅ ${page.name || page.metadata?.name}`);
        console.log(`     ID: ${page.provider_id}`);
        console.log(`     Token Type: ${page.metadata?.tokenType || 'unknown'}`);
      });
    } else {
      console.log(`  ❌ NO FACEBOOK PAGES FOUND!`);
      console.log(`  ⚠️  This is why posting fails - you need Page tokens, not user tokens!`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkFacebookPages();
