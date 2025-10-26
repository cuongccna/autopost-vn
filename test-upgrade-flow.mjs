// Quick test script for upgrade flow
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testUpgradeFlow() {
  console.log('🧪 Testing Upgrade Flow...\n');

  // Test 1: Check if pricing page loads
  console.log('1️⃣ Testing pricing page...');
  try {
    const response = await fetch(`${BASE_URL}/pricing`);
    console.log(`✓ Pricing page: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log('✗ Pricing page failed:', error.message);
  }

  // Test 2: Test upgrade request API (without auth - should fail)
  console.log('\n2️⃣ Testing upgrade request without auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/upgrade-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPlan: 'professional' })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    if (response.status === 401) {
      console.log('✓ Correctly returns 401 Unauthorized');
    } else {
      console.log('✗ Expected 401, got:', response.status);
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
  }

  // Test 3: Test activation endpoint with invalid token
  console.log('\n3️⃣ Testing activation with invalid token...');
  try {
    const response = await fetch(`${BASE_URL}/api/activate-upgrade?token=invalid`);
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    if (text.includes('Token không hợp lệ') || text.includes('Invalid')) {
      console.log('✓ Correctly shows invalid token message');
    } else {
      console.log('✗ Unexpected response');
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
  }

  console.log('\n✅ Basic tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Login to the app at http://localhost:3000/app');
  console.log('2. Navigate to http://localhost:3000/pricing');
  console.log('3. Click "Chọn Professional" button');
  console.log('4. Test payment modal and upgrade request');
}

testUpgradeFlow();
