// Test UserManagementService with real database
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { userManagementServicePG } from './src/lib/services/UserManagementService';

async function testUserManagementService() {
  console.log('🧪 Testing UserManagementService.pg.ts with real database...\n');
  
  const testEmail = 'test@autopostvn.com';
  
  try {
    // Test 1: Get or create workspace
    console.log('Test 1: Get or Create User Workspace');
    const workspace = await userManagementServicePG.getOrCreateUserWorkspace(testEmail);
    console.log('✅ Workspace:', {
      id: workspace.id,
      name: workspace.workspace_name
    });
    
    // Test 2: Get social accounts
    console.log('\nTest 2: Get User Social Accounts');
    const accounts = await userManagementServicePG.getUserSocialAccounts(testEmail);
    console.log('✅ Found accounts:', accounts.length);
    if (accounts.length > 0) {
      console.log('   Sample account:', {
        provider: accounts[0].provider,
        status: accounts[0].status,
        hasToken: !!accounts[0].access_token
      });
    }
    
    // Test 3: Save OAuth account
    console.log('\nTest 3: Save New OAuth Account');
    const oauthData = {
      access_token: 'test_access_token_' + Date.now(),
      refresh_token: 'test_refresh_token_' + Date.now(),
      expires_in: 3600,
      account_info: {
        providerId: 'instagram_test_' + Date.now(),
        name: 'Test Instagram Account',
        username: 'test_instagram',
        profile_picture: 'https://example.com/avatar.jpg'
      }
    };
    
    const savedAccount = await userManagementServicePG.saveOAuthAccount(
      testEmail,
      'instagram',
      oauthData
    );
    console.log('✅ Account saved:', {
      id: savedAccount.id,
      provider: savedAccount.provider,
      status: savedAccount.status
    });
    
    // Test 4: Update account status
    console.log('\nTest 4: Update Account Status to "expired"');
    await userManagementServicePG.updateAccountStatus(
      savedAccount.id,
      'expired'
    );
    console.log('✅ Status updated to expired');
    
    // Test 5: Re-save account (update existing)
    console.log('\nTest 5: Update Existing Account (refresh token)');
    const refreshedOAuthData = {
      ...oauthData,
      access_token: 'refreshed_token_' + Date.now(),
    };
    const reactivated = await userManagementServicePG.saveOAuthAccount(
      testEmail,
      'instagram',
      refreshedOAuthData
    );
    console.log('✅ Account refreshed:', {
      id: reactivated.id,
      status: reactivated.status,
      sameId: reactivated.id === savedAccount.id
    });
    
    // Test 6: Disconnect account
    console.log('\nTest 6: Disconnect Account');
    await userManagementServicePG.disconnectAccount(savedAccount.id, testEmail);
    console.log('✅ Account disconnected');
    
    // Test 7: Get user posts
    console.log('\nTest 7: Get User Posts');
    const posts = await userManagementServicePG.getUserPosts(testEmail);
    console.log('✅ Found posts:', posts.length);
    
    console.log('\n🎉 All UserManagementService tests passed!');
    console.log('\n📊 Service Summary:');
    console.log('   - Workspace operations: ✅ Working');
    console.log('   - Social account CRUD: ✅ Working');
    console.log('   - Status updates: ✅ Working');
    console.log('   - Delete operations: ✅ Working');
    console.log('   - Post queries: ✅ Working');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Service test failed:', error);
    process.exit(1);
  }
}

testUserManagementService();
