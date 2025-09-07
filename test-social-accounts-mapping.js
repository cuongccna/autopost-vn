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

async function testSocialAccountsMapping() {
  try {
    console.log('=== Testing Social Accounts Mapping ===');
    
    // Create test social account in main table
    const testWorkspaceId = 'e81c13d9-5a31-43b7-b117-6494033f40a8'; // Your real workspace
    
    const testAccount = {
      workspace_id: testWorkspaceId,
      provider: 'facebook',
      provider_id: 'test_fb_123',
      name: 'Test Facebook Page',
      username: 'test_fb_page',
      token_encrypted: btoa('test_access_token'),
      refresh_token_encrypted: btoa('test_refresh_token'),
      status: 'connected',
      metadata: {
        category: 'Business',
        follower_count: 1000
      }
    };
    
    // Insert test account
    const { data: inserted, error: insertError } = await supabase
      .from('autopostvn_social_accounts')
      .insert(testAccount)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting test account:', insertError);
      return;
    }
    
    console.log('✅ Test account created:', inserted.id);
    
    // Test the mapping by reading directly
    const { data: accounts, error: fetchError } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('workspace_id', testWorkspaceId);
    
    if (fetchError) {
      console.error('Error fetching accounts:', fetchError);
      return;
    }
    
    console.log(`Found ${accounts?.length || 0} accounts in workspace`);
    
    // Test mapping logic
    const mappedAccounts = (accounts || []).map(account => ({
      id: account.id,
      user_email: 'test@example.com',
      workspace_id: account.workspace_id,
      provider: account.provider,
      account_name: account.name || account.username || 'Unknown',
      provider_account_id: account.provider_id,
      access_token: account.token_encrypted ? 'ENCRYPTED' : '',
      refresh_token: account.refresh_token_encrypted ? 'ENCRYPTED' : null,
      token_expires_at: account.expires_at,
      account_data: {
        name: account.name || account.username || 'Unknown',
        category: account.metadata?.category,
        profile_picture: account.avatar_url,
        follower_count: account.metadata?.follower_count
      },
      status: account.status === 'connected' ? 'connected' : 
              account.status === 'expired' ? 'expired' : 'error',
      created_at: account.created_at,
      updated_at: account.updated_at
    }));
    
    console.log('Mapped accounts:');
    console.log(JSON.stringify(mappedAccounts, null, 2));
    
    // Cleanup
    await supabase
      .from('autopostvn_social_accounts')
      .delete()
      .eq('id', inserted.id);
    
    console.log('✅ Test account cleaned up');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSocialAccountsMapping();
