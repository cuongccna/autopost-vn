// Test save và load settings
async function testSettingsPersistence() {
  console.log('🧪 Testing Settings Persistence\n');
  
  const API_BASE = 'http://localhost:3000';
  
  try {
    // 1. Save settings với tất cả unchecked
    console.log('1️⃣ Saving settings with all notifications unchecked...');
    const savePayload = {
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
    
    console.log('Payload:', JSON.stringify(savePayload, null, 2));
    
    // Note: Bạn cần thêm authentication header nếu test từ Node.js
    // Hoặc test trực tiếp trên browser console
    
    console.log('\n2️⃣ To test in browser console:');
    console.log(`
// Save settings
await fetch('/api/workspace/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(savePayload)})
}).then(r => r.json()).then(console.log);

// Load settings back
await fetch('/api/workspace/settings')
  .then(r => r.json())
  .then(data => {
    console.log('Loaded settings:', data);
    console.log('Notifications:', data.settings.notifications);
  });
`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSettingsPersistence();
