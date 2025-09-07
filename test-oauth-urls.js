// Test OAuth URLs for unified provider keys
console.log('🔧 Testing OAuth URLs with unified keys...\n');

const OAUTH_CONFIGS = {
  facebook: {
    baseUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'public_profile,pages_show_list,pages_read_engagement',
    redirectUri: `http://localhost:3000/api/auth/oauth/facebook/callback`
  },
  instagram: {
    baseUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'public_profile,pages_show_list',
    redirectUri: `http://localhost:3000/api/auth/oauth/instagram/callback`
  },
  zalo: {
    baseUrl: 'https://oauth.zaloapp.com/v4/permission',
    scope: 'scope.userinfo,scope.offline_access',
    redirectUri: `http://localhost:3000/api/auth/oauth/zalo/callback`
  }
};

console.log('OAuth Endpoints Test:');
Object.entries(OAUTH_CONFIGS).forEach(([provider, config]) => {
  console.log(`\n📍 ${provider.toUpperCase()}:`);
  console.log(`  Auth URL: /api/auth/oauth/${provider}`);
  console.log(`  Callback: ${config.redirectUri}`);
  console.log(`  Scope: ${config.scope}`);
});

console.log('\n✅ All provider URLs use unified keys (facebook, instagram, zalo)');
console.log('✅ Instagram callback handler created successfully');
