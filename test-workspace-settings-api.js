// Test workspace settings API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';
const WORKSPACE_ID = 'ed172ece-2dc6-4ee2-b1cf-0c1301681650'; // Replace with your workspace ID

async function testWorkspaceSettingsAPI() {
  console.log('🧪 Testing Workspace Settings API\n');
  
  try {
    // Test 1: GET settings
    console.log('📥 Test 1: GET /api/workspace/settings');
    const getResponse = await fetch(`${API_BASE}/api/workspace/settings?workspace_id=${WORKSPACE_ID}`);
    
    if (!getResponse.ok) {
      console.error('❌ GET failed:', getResponse.status, getResponse.statusText);
      const error = await getResponse.text();
      console.error('Error:', error);
      return;
    }
    
    const currentSettings = await getResponse.json();
    console.log('✅ Current settings:', JSON.stringify(currentSettings, null, 2));
    console.log('');
    
    // Test 2: PUT settings (update)
    console.log('📤 Test 2: PUT /api/workspace/settings');
    const newSettings = {
      workspaceId: WORKSPACE_ID,
      settings: {
        notifications: {
          onSuccess: false,
          onFailure: true,
          onTokenExpiry: true,
        },
        scheduling: {
          timezone: 'Asia/Bangkok',
          goldenHours: ['08:00', '13:00', '19:00'],
          rateLimit: 15,
        },
        advanced: {
          autoDeleteOldPosts: true,
          autoDeleteDays: 60,
          testMode: false,
        },
      },
    };
    
    const putResponse = await fetch(`${API_BASE}/api/workspace/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSettings),
    });
    
    if (!putResponse.ok) {
      console.error('❌ PUT failed:', putResponse.status, putResponse.statusText);
      const error = await putResponse.text();
      console.error('Error:', error);
      return;
    }
    
    const updatedSettings = await putResponse.json();
    console.log('✅ Updated settings:', JSON.stringify(updatedSettings, null, 2));
    console.log('');
    
    // Test 3: Verify update by GET again
    console.log('📥 Test 3: Verify update with GET');
    const verifyResponse = await fetch(`${API_BASE}/api/workspace/settings?workspace_id=${WORKSPACE_ID}`);
    const verifiedSettings = await verifyResponse.json();
    console.log('✅ Verified settings:', JSON.stringify(verifiedSettings, null, 2));
    console.log('');
    
    // Test 4: Restore original settings
    console.log('🔄 Test 4: Restore original settings');
    const restoreResponse = await fetch(`${API_BASE}/api/workspace/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId: WORKSPACE_ID,
        settings: currentSettings.settings,
      }),
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Settings restored successfully');
    }
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkspaceSettingsAPI();
