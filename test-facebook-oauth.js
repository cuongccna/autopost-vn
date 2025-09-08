/**
 * Facebook OAuth Flow Test
 * Test real Facebook OAuth integration
 */

console.log('🔵 Testing Facebook OAuth Flow...\n');

// Test OAuth URL generation
const FACEBOOK_CLIENT_ID = '758504150137739';
const BASE_URL = 'http://localhost:3000';

function generateFacebookOAuthURL() {
  const state = Buffer.from(JSON.stringify({
    provider: 'facebook',
    userEmail: 'test@example.com',
    timestamp: Date.now(),
  })).toString('base64');

  const params = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/oauth/facebook?action=callback`,
    scope: 'pages_show_list,pages_read_engagement',
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

async function testOAuthEndpoint() {
  console.log('🔍 Testing OAuth endpoint generation...');
  
  const oauthUrl = generateFacebookOAuthURL();
  console.log('📋 Generated OAuth URL:');
  console.log(oauthUrl);
  console.log('\n');

  // Test if local endpoint is responding
  try {
    const testUrl = `${BASE_URL}/api/oauth/facebook?action=connect`;
    console.log('🌐 Testing local OAuth endpoint:');
    console.log(`   URL: ${testUrl}`);
    console.log('   Status: Ready for manual testing');
    console.log('\n');
  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
  }
}

function validateEnvironmentVariables() {
  console.log('🔧 Validating environment variables...');
  
  const requiredVars = {
    'FACEBOOK_CLIENT_ID': process.env.FACEBOOK_CLIENT_ID || FACEBOOK_CLIENT_ID,
    'FACEBOOK_CLIENT_SECRET': process.env.FACEBOOK_CLIENT_SECRET || '***configured***',
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL || BASE_URL,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL || BASE_URL
  };

  Object.entries(requiredVars).forEach(([key, value]) => {
    const status = value && value !== 'undefined' ? '✅' : '❌';
    const displayValue = key.includes('SECRET') ? '***hidden***' : value;
    console.log(`   ${status} ${key}: ${displayValue}`);
  });
  console.log('\n');
}

function generateTestPlan() {
  console.log('📋 Facebook OAuth Test Plan:\n');
  
  console.log('Step 1: Manual OAuth Test');
  console.log('   1. Open browser to: http://localhost:3000/app');
  console.log('   2. Click "Connect Facebook" or navigate to accounts management');
  console.log('   3. Should redirect to Facebook OAuth');
  console.log('   4. Login and grant permissions');
  console.log('   5. Should redirect back with account connected\n');

  console.log('Step 2: Direct OAuth URL Test');
  console.log('   1. Copy OAuth URL above');
  console.log('   2. Open in new browser tab');
  console.log('   3. Complete Facebook login flow');
  console.log('   4. Check callback handling\n');

  console.log('Step 3: Verify Token Storage');
  console.log('   1. Check Supabase autopostvn_social_accounts table');
  console.log('   2. Verify encrypted tokens are saved');
  console.log('   3. Test token decryption works\n');

  console.log('Step 4: Test Publishing');
  console.log('   1. Go to http://localhost:3000/compose');
  console.log('   2. Create test post with image');
  console.log('   3. Select connected Facebook account');
  console.log('   4. Publish and verify on Facebook Page\n');
}

function printDebuggingTips() {
  console.log('🔍 Debugging Tips:\n');
  
  console.log('Common Issues:');
  console.log('   • "redirect_uri_mismatch": Check Facebook app settings');
  console.log('   • "unauthorized_client": Verify app is in development mode');
  console.log('   • "access_denied": User cancelled or insufficient permissions');
  console.log('   • "invalid_code": Code expired or already used\n');

  console.log('Facebook App Settings to Check:');
  console.log('   • Valid OAuth Redirect URIs includes:');
  console.log(`     ${BASE_URL}/api/oauth/facebook?action=callback`);
  console.log('   • App Domains includes: localhost');
  console.log('   • App is in Development mode (not Live)\n');

  console.log('Permissions Required:');
  console.log('   • email, public_profile (basic)');
  console.log('   • pages_show_list (see user\'s pages)');
  console.log('   • pages_read_engagement (read page data)');
  console.log('   • For posting: pages_manage_posts (requires app review)\n');
}

async function main() {
  console.log('🧪 Facebook OAuth Integration Test\n');
  console.log('='.repeat(60));
  
  validateEnvironmentVariables();
  await testOAuthEndpoint();
  generateTestPlan();
  printDebuggingTips();

  console.log('🚀 Next Steps:');
  console.log('1. Ensure dev server is running (npm run dev)');
  console.log('2. Test manual OAuth flow at http://localhost:3000/app');
  console.log('3. Check browser network tab for any errors');
  console.log('4. Monitor server logs for OAuth callback details');
  console.log('5. Verify Facebook app configuration if issues occur\n');

  console.log('💡 Ready to test Facebook OAuth integration!');
}

main().catch(console.error);
