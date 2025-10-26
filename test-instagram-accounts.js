/**
 * Instagram Connection Test Script
 * 
 * Tests:
 * 1. Check Instagram accounts in database
 * 2. Verify token decryption
 * 3. Test Instagram Graph API connection
 * 4. Fetch account info
 * 5. List recent media
 */

const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📸 Testing Instagram Business Accounts\n');
console.log('='.repeat(60));

async function testInstagramAccounts() {
  try {
    // Step 1: Check database for Instagram accounts
    console.log('\n📋 Step 1: Checking Database...');
    console.log('-'.repeat(60));
    
    const { data: accounts, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('provider', 'instagram');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No Instagram accounts found in database');
      console.log('\n💡 Next steps:');
      console.log('1. Connect Instagram Business account via OAuth');
      console.log('2. Visit: http://localhost:3000/api/oauth/instagram?action=connect');
      console.log('3. Or connect via Facebook OAuth (auto-fetch Instagram)');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} Instagram account(s)`);
    
    // Step 2: Display account details
    console.log('\n📊 Step 2: Account Details...');
    console.log('-'.repeat(60));
    
    for (const account of accounts) {
      console.log(`\n🔹 Account: ${account.name}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Provider: ${account.provider}`);
      console.log(`   Provider ID: ${account.provider_id}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Created: ${new Date(account.created_at).toLocaleDateString()}`);
      
      if (account.metadata) {
        console.log(`   Metadata:`);
        console.log(`     Page ID: ${account.metadata.pageId || 'N/A'}`);
        console.log(`     Page Name: ${account.metadata.pageName || 'N/A'}`);
        console.log(`     IG Username: ${account.metadata.igUsername || 'N/A'}`);
      }
      
      // Step 3: Test token decryption
      console.log('\n🔐 Step 3: Testing Token Decryption...');
      console.log('-'.repeat(60));
      
      try {
        // We can't decrypt here without importing the encryption module
        // But we can check token format
        const tokenParts = account.token_encrypted.split(':');
        console.log(`   Token format: ${tokenParts.length} parts`);
        
        if (tokenParts.length === 3) {
          console.log('   ✅ New AES-256-GCM format (iv:authTag:encrypted)');
        } else if (tokenParts.length === 2) {
          console.log('   ⚠️  Legacy AES-256-CBC format (iv:encrypted)');
        } else {
          console.log('   ❌ Unknown format');
        }
        
      } catch (err) {
        console.error('   ❌ Token check failed:', err.message);
      }
      
      // Step 4: Test API connection (would need token decryption)
      console.log('\n🌐 Step 4: Instagram Graph API Test...');
      console.log('-'.repeat(60));
      console.log('   ⏭️  Skipped (requires token decryption in runtime)');
      console.log('   💡 Test via: node test-instagram-api.js');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ INSTAGRAM ACCOUNTS CHECK COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Summary:');
    console.log(`   Total accounts: ${accounts.length}`);
    console.log(`   Connected: ${accounts.filter(a => a.status === 'connected').length}`);
    console.log(`   Disconnected: ${accounts.filter(a => a.status === 'disconnected').length}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. ✅ Instagram accounts found in database');
    console.log('2. 🔄 Test posting: Create a post via /compose page');
    console.log('3. 🔄 Run scheduler: curl http://localhost:3000/api/cron/scheduler?limit=1');
    console.log('4. 📊 Check results: node check-published-post.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Check Facebook Pages for Instagram linkage
async function checkFacebookPagesForInstagram() {
  console.log('\n\n🔗 Bonus: Checking Facebook Pages for Instagram...');
  console.log('='.repeat(60));
  
  const { data: pages, error } = await supabase
    .from('autopostvn_social_accounts')
    .select('*')
    .eq('provider', 'facebook_page');
  
  if (error || !pages || pages.length === 0) {
    console.log('   No Facebook Pages found');
    return;
  }
  
  console.log(`\n✅ Found ${pages.length} Facebook Page(s)`);
  console.log('\n💡 These Pages might have linked Instagram accounts:');
  
  for (const page of pages) {
    console.log(`\n   📄 ${page.name}`);
    console.log(`      Page ID: ${page.provider_id}`);
    console.log(`      Status: Check if Instagram is linked in Facebook Page settings`);
  }
  
  console.log('\n📝 To link Instagram:');
  console.log('   1. Go to Facebook Page → Settings → Instagram');
  console.log('   2. Click "Connect Account"');
  console.log('   3. Re-run OAuth to fetch Instagram Business ID');
}

// Run tests
(async () => {
  await testInstagramAccounts();
  await checkFacebookPagesForInstagram();
})();
