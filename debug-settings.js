// Debug: Check what's actually in the database
// Open browser console and run this:

console.log('🔍 Checking workspace settings in database...\n');

// 1. Check current settings
fetch('/api/workspace/settings')
  .then(r => r.json())
  .then(data => {
    console.log('📥 Current Settings from API:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📋 Notifications:');
    console.log('  - onSuccess:', data.settings.notifications.onSuccess);
    console.log('  - onFailure:', data.settings.notifications.onFailure);
    console.log('  - onTokenExpiry:', data.settings.notifications.onTokenExpiry);
  });

// 2. Save test settings (all unchecked)
console.log('\n💾 Saving test settings (all notifications = false)...');

const testSettings = {
  settings: {
    notifications: {
      onSuccess: false,
      onFailure: false,
      onTokenExpiry: false,
    },
    scheduling: {
      timezone: 'Asia/Ho_Chi_Minh',
      goldenHours: ['09:00', '12:30', '20:00'],
      rateLimit: 10,
    },
    advanced: {
      autoDeleteOldPosts: false,
      autoDeleteDays: 30,
      testMode: false,
    },
  },
};

fetch('/api/workspace/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testSettings),
})
  .then(r => r.json())
  .then(result => {
    console.log('✅ Save Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // 3. Verify by loading again
    console.log('\n🔄 Verifying by loading again...');
    return fetch('/api/workspace/settings');
  })
  .then(r => r.json())
  .then(data => {
    console.log('📥 Reloaded Settings:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✅ Verification:');
    console.log('  - onSuccess:', data.settings.notifications.onSuccess, '(should be false)');
    console.log('  - onFailure:', data.settings.notifications.onFailure, '(should be false)');
    console.log('  - onTokenExpiry:', data.settings.notifications.onTokenExpiry, '(should be false)');
  });
