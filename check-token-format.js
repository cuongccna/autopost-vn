/**
 * 🔍 Check token storage format in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Checking token storage format...\n');

  const { data: pages, error } = await supabase
    .from('autopostvn_social_accounts')
    .select('*')
    .eq('provider', 'facebook_page')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!pages || pages.length === 0) {
    console.log('⚠️  No pages found');
    return;
  }

  const page = pages[0];
  console.log('📄 Sample Page:', page.name);
  console.log('🆔 Provider ID:', page.provider_id);
  console.log('🔑 Token encrypted (first 50 chars):', page.token_encrypted?.substring(0, 50) + '...');
  console.log('📦 Token type:', typeof page.token_encrypted);
  console.log('📏 Token length:', page.token_encrypted?.length);
  console.log('\n🔧 Token format analysis:');
  
  if (page.token_encrypted) {
    const parts = page.token_encrypted.split(':');
    console.log(`   Parts count: ${parts.length}`);
    
    if (parts.length === 3) {
      console.log('   ✅ Format: AES-256-GCM (iv:authTag:encryptedData)');
      console.log(`   IV length: ${parts[0].length} chars`);
      console.log(`   AuthTag length: ${parts[1].length} chars`);
      console.log(`   Data length: ${parts[2].length} chars`);
    } else if (parts.length === 2) {
      console.log('   ✅ Format: AES-256-CBC (iv:encryptedData)');
      console.log(`   IV length: ${parts[0].length} chars`);
      console.log(`   Data length: ${parts[1].length} chars`);
    } else if (parts.length === 1) {
      console.log('   ⚠️  Format: Plain text or Base64 (no encryption)');
      // Try to detect if it's a valid access token
      if (page.token_encrypted.startsWith('EAA')) {
        console.log('   🎯 Looks like a Facebook access token (starts with EAA)');
        console.log('   ⚠️  TOKEN IS NOT ENCRYPTED!');
      }
    }
  }

  console.log('\n📊 Full record:');
  console.log(JSON.stringify(page, null, 2));
}

main();
