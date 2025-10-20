// Debug Facebook Account Token
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFacebookAccount() {
  try {
    console.log('🔍 Checking Facebook accounts...\n');

    // Get all Facebook accounts
    const { data: accounts, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!accounts || accounts.length === 0) {
      console.log('❌ No Facebook accounts found');
      return;
    }

    console.log(`✅ Found ${accounts.length} accounts:\n`);

    for (const account of accounts) {
      console.log('─────────────────────────────────────');
      console.log('📋 Name:', account.provider_account_name || 'N/A');
      console.log('🔑 Provider:', account.provider);
      console.log('🆔 Provider ID:', account.provider_id);
      console.log('👤 User Email:', account.user_email || account.user_id || 'N/A');
      console.log('📅 Created:', account.created_at);
      
      // Check metadata
      console.log('📦 Metadata:', JSON.stringify(account.metadata, null, 2));
      
      // Check if token exists
      const hasToken = !!account.token_encrypted;
      console.log('🔐 Has Token:', hasToken ? '✅' : '❌');
      
      const metadata = account.metadata || {};
      if (metadata.tokenType === 'page_token') {
        console.log('✅ This is a PAGE TOKEN (correct for posting)');
      } else if (metadata.tokenType === 'user_token') {
        console.log('⚠️  This is a USER TOKEN (cannot post to pages)');
      } else {
        console.log('❓ Token type UNKNOWN - might be user token!');
      }
      
      console.log();
    }

    console.log('─────────────────────────────────────\n');
    
    // Check which account is being used for posting
    const { data: posts, error: postsError } = await supabase
      .from('autopostvn_posts')
      .select('id, scheduled_at, post_accounts(provider_account_name, provider)')
      .eq('status', 'scheduled')
      .limit(5);

    if (posts && posts.length > 0) {
      console.log('📝 Upcoming scheduled posts:');
      posts.forEach(post => {
        console.log(`  - Post ${post.id}`);
        if (post.post_accounts) {
          post.post_accounts.forEach(acc => {
            console.log(`    → ${acc.provider}: ${acc.provider_account_name}`);
          });
        }
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugFacebookAccount();
