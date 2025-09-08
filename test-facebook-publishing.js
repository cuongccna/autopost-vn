#!/usr/bin/env node

/**
 * 🧪 Facebook Page Publishing Test Script
 * Test Facebook Page access and publishing capabilities
 */

const https = require('https');
const { URLSearchParams } = require('url');

console.log('🔵 Testing Facebook Page Publishing Setup...\n');

// Environment validation
console.log('🔧 Environment Check:');
const requiredEnvs = {
  'FACEBOOK_CLIENT_ID': process.env.FACEBOOK_CLIENT_ID,
  'FACEBOOK_CLIENT_SECRET': process.env.FACEBOOK_CLIENT_SECRET,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'ENCRYPTION_KEY': process.env.ENCRYPTION_KEY
};

let envValid = true;
Object.entries(requiredEnvs).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key.includes('SECRET') || key.includes('KEY') 
    ? (value ? '***hidden***' : 'missing') 
    : value || 'missing';
  console.log(`   ${status} ${key}: ${displayValue}`);
  if (!value) envValid = false;
});

if (!envValid) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
}

console.log('\n🎯 Facebook Publishing Test Checklist:\n');

console.log('📋 Pre-Publishing Requirements:');
console.log('   □ Facebook account connected via OAuth');
console.log('   □ User has admin access to a Facebook Page');
console.log('   □ Page permissions granted during OAuth');
console.log('   □ App has pages_manage_posts permission (may need review)');

console.log('\n🔧 Required Facebook App Permissions:');
console.log('   □ email, public_profile (basic)');
console.log('   □ pages_show_list (see user pages)');
console.log('   □ pages_read_engagement (read page data)');
console.log('   □ pages_manage_posts (publish to pages) ⚠️');

console.log('\n⚠️  Important Notes:');
console.log('   • pages_manage_posts may require Facebook app review');
console.log('   • For testing, use development mode with test users');
console.log('   • Test users can be added in Facebook App settings');
console.log('   • Production requires live app review process');

console.log('\n🧪 Testing Flow:');
console.log('   1. 🌐 OAuth: http://localhost:3000/app → Connect Facebook');
console.log('   2. 📝 Compose: http://localhost:3000/compose → Create post');
console.log('   3. 🎯 Publish: Select Facebook account → Submit');
console.log('   4. ✅ Verify: Check Facebook Page for published content');

console.log('\n📊 Test Content Suggestions:');

const testPosts = [
  {
    type: 'Text Only',
    content: `🚀 Testing AutoPost VN - Facebook Integration
Vietnamese text: Đây là bài test tiếng Việt với emoji 🇻🇳
Hashtags: #AutoPostVN #SocialMedia #Testing
Time: ${new Date().toLocaleString('vi-VN')}`
  },
  {
    type: 'With Image',
    content: `📸 Testing image upload to Facebook Page
Image + Vietnamese caption test
#AutoPostVN #ImageTest #Facebook`
  },
  {
    type: 'Scheduled',
    content: `⏰ This is a scheduled post test
Posted via AutoPost VN scheduler
#ScheduledPost #AutoPostVN`
  }
];

testPosts.forEach((post, index) => {
  console.log(`\n   Test ${index + 1}: ${post.type}`);
  console.log(`   Content: "${post.content}"`);
});

console.log('\n🔍 Debugging Commands:');
console.log('\n   Check connected accounts:');
console.log('   ```sql');
console.log('   SELECT provider, account_name, created_at ');
console.log('   FROM autopostvn_social_accounts ');
console.log('   WHERE provider = \'facebook\';');
console.log('   ```');

console.log('\n   Check published posts:');
console.log('   ```sql');
console.log('   SELECT platform, content, status, created_at ');
console.log('   FROM autopostvn_posts ');
console.log('   WHERE platform = \'facebook\' ');
console.log('   ORDER BY created_at DESC;');
console.log('   ```');

console.log('\n🌐 Quick Access URLs:');
console.log(`   • App Dashboard: http://localhost:3000/app`);
console.log(`   • Compose Page: http://localhost:3000/compose`);
console.log(`   • Account Settings: http://localhost:3000/settings`);

console.log('\n🔧 Facebook App Settings to Verify:');
console.log('   • App Mode: Development (for testing)');
console.log('   • Valid OAuth Redirect URIs: http://localhost:3000/api/oauth/facebook?action=callback');
console.log('   • App Domains: localhost');
console.log('   • Test Users: Add test users for safe testing');

console.log('\n🚨 Troubleshooting Common Issues:');

const commonIssues = [
  {
    issue: 'OAuth redirect_uri_mismatch',
    solution: 'Check Facebook app Valid OAuth Redirect URIs'
  },
  {
    issue: 'insufficient permissions',
    solution: 'Add pages_manage_posts permission (may need review)'
  },
  {
    issue: 'Page not accessible',
    solution: 'User must be admin of Facebook Page'
  },
  {
    issue: 'Token expired',
    solution: 'Re-connect Facebook account via OAuth'
  },
  {
    issue: 'Publishing fails',
    solution: 'Check page permissions and app review status'
  }
];

commonIssues.forEach(({ issue, solution }) => {
  console.log(`   • ${issue}: ${solution}`);
});

console.log('\n📱 Mobile Testing:');
console.log('   • Test OAuth flow on mobile browser');
console.log('   • Verify responsive design on compose page');
console.log('   • Test image upload from mobile device');

console.log('\n🎯 Success Criteria:');
console.log('   ✅ OAuth completes without errors');
console.log('   ✅ Facebook account appears in connected list');
console.log('   ✅ Posts publish successfully to Facebook Page');
console.log('   ✅ Content appears correctly on Facebook');
console.log('   ✅ Database records created properly');

console.log('\n🚀 Ready to Test Facebook Page Publishing!');
console.log('\n💡 Start by opening: http://localhost:3000/app');
console.log('   Then follow the step-by-step guide above.');

// Generate test OAuth URL for quick access
const oauthParams = new URLSearchParams({
  client_id: process.env.FACEBOOK_CLIENT_ID,
  redirect_uri: 'http://localhost:3000/api/oauth/facebook?action=callback',
  scope: 'pages_show_list,pages_read_engagement,pages_manage_posts',
  response_type: 'code',
  state: Buffer.from(JSON.stringify({
    provider: 'facebook',
    userEmail: 'test@example.com',
    timestamp: Date.now()
  })).toString('base64')
});

console.log('\n🔗 Direct OAuth URL (for advanced testing):');
console.log(`https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`);
