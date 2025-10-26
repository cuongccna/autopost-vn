/**
 * Test Facebook Insights API directly
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fmvxmvahknbzzjzhofql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdnhtdmFoa25ienpqemhvZnFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNzM4NSwiZXhwIjoyMDcxMTkzMzg1fQ.4QdCKgptvWzLEKgAxgLbvfORLLwzu8aXUzTYp1fw_oo'
);

// Mock OAuthTokenManager
class MockOAuthTokenManager {
  static decryptForUse(encryptedToken) {
    if (encryptedToken.startsWith('enc_')) {
      const encoded = encryptedToken.substring(4);
      const payload = Buffer.from(encoded, 'base64').toString('utf8');
      const data = JSON.parse(payload);
      return data.token;
    }
    return encryptedToken;
  }
}

async function testFacebookInsights() {
  console.log('🔍 Testing Facebook Insights API...\n');
  
  const workspaceId = 'ed172ece-2dc6-4ee2-b1cf-0c1301681650';
  
  // Get published schedules
  const { data: schedules } = await supabase
    .from('autopostvn_post_schedules')
    .select(`
      id,
      external_post_id,
      status,
      social_account_id,
      autopostvn_social_accounts (
        id,
        name,
        provider,
        token_encrypted
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'published')
    .limit(1);

  if (!schedules || schedules.length === 0) {
    console.log('❌ No published posts found');
    return;
  }

  const schedule = schedules[0];
  const account = schedule.autopostvn_social_accounts;
  const postId = schedule.external_post_id;
  
  console.log('📄 Testing Post:');
  console.log('  Post ID:', postId);
  console.log('  Account:', account.name);
  console.log('  Provider:', account.provider);
  
  // Decrypt token
  const accessToken = MockOAuthTokenManager.decryptForUse(account.token_encrypted);
  console.log('  Token:', accessToken.substring(0, 20) + '...');
  
  // Fetch post data
  console.log('\n📊 Fetching post engagement...');
  const postUrl = `https://graph.facebook.com/v21.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
  
  try {
    const postResponse = await fetch(postUrl);
    const postData = await postResponse.json();
    
    if (postData.error) {
      console.log('❌ Post API Error:', postData.error);
    } else {
      console.log('✅ Post Data:', {
        likes: postData.likes?.summary?.total_count || 0,
        comments: postData.comments?.summary?.total_count || 0,
        shares: postData.shares?.count || 0
      });
    }
  } catch (error) {
    console.log('❌ Post fetch error:', error.message);
  }
  
  // Fetch insights
  console.log('\n📈 Fetching insights...');
  const insightsUrl = `https://graph.facebook.com/v21.0/${postId}/insights?metric=post_impressions,post_reach,post_engaged_users&access_token=${accessToken}`;
  
  try {
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    if (insightsData.error) {
      console.log('❌ Insights API Error:', insightsData.error);
      console.log('   Code:', insightsData.error.code);
      console.log('   Message:', insightsData.error.message);
      console.log('   Type:', insightsData.error.type);
    } else if (insightsData.data) {
      console.log('✅ Insights Data:');
      insightsData.data.forEach(insight => {
        console.log(`   ${insight.name}:`, insight.values[0]?.value || 0);
      });
    } else {
      console.log('⚠️ No insights data:', insightsData);
    }
  } catch (error) {
    console.log('❌ Insights fetch error:', error.message);
  }
}

testFacebookInsights().catch(console.error);
