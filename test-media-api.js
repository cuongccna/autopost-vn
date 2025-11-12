#!/usr/bin/env node

/**
 * Test script for Media Upload API
 * Usage: node test-media-api.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test configuration
const API_BASE = 'http://localhost:3000';
const TEST_FILES_DIR = './test-files';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Create test files if they don't exist
async function createTestFiles() {
  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  // Create a small test image (1x1 PNG)
  const smallImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'test-image.png'), smallImageBuffer);
  
  // Create a large file (simulate)
  const largeBuffer = Buffer.alloc(15 * 1024 * 1024, 0xFF); // 15MB
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'large-file.jpg'), largeBuffer);
  
  // Create invalid file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'invalid.txt'), 'This is a text file');
  
  log('green', '✅ Test files created successfully');
}

// Test single file upload
async function testSingleUpload() {
  log('cyan', '\n🧪 Testing single file upload...');
  
  try {
    const filePath = path.join(TEST_FILES_DIR, 'test-image.png');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Single upload successful');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      log('red', '❌ Single upload failed');
      console.log('Error:', result);
    }
  } catch (error) {
    log('red', `❌ Single upload error: ${error.message}`);
  }
}

// Test multiple files upload
async function testMultipleUpload() {
  log('cyan', '\n🧪 Testing multiple files upload...');
  
  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(path.join(TEST_FILES_DIR, 'test-image.png')));
    formData.append('files', fs.createReadStream(path.join(TEST_FILES_DIR, 'test-image.png')));
    
    const response = await fetch(`${API_BASE}/api/media`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Multiple upload successful');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      log('red', '❌ Multiple upload failed');
      console.log('Error:', result);
    }
  } catch (error) {
    log('red', `❌ Multiple upload error: ${error.message}`);
  }
}

// Test large file upload
async function testLargeFileUpload() {
  log('cyan', '\n🧪 Testing large file upload (should fail)...');
  
  try {
    const filePath = path.join(TEST_FILES_DIR, 'large-file.jpg');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('yellow', '⚠️ Large file upload unexpectedly succeeded');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      log('green', '✅ Large file correctly rejected');
      console.log('Error (expected):', result);
    }
  } catch (error) {
    log('red', `❌ Large file upload error: ${error.message}`);
  }
}

// Test invalid file type
async function testInvalidFileType() {
  log('cyan', '\n🧪 Testing invalid file type (should fail)...');
  
  try {
    const filePath = path.join(TEST_FILES_DIR, 'invalid.txt');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      log('yellow', '⚠️ Invalid file type unexpectedly accepted');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      log('green', '✅ Invalid file type correctly rejected');
      console.log('Error (expected):', result);
    }
  } catch (error) {
    log('red', `❌ Invalid file type test error: ${error.message}`);
  }
}

// Test media listing
async function testMediaListing() {
  log('cyan', '\n🧪 Testing media listing...');
  
  try {
    const response = await fetch(`${API_BASE}/api/media`);
    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Media listing successful');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      log('red', '❌ Media listing failed');
      console.log('Error:', result);
    }
  } catch (error) {
    log('red', `❌ Media listing error: ${error.message}`);
  }
}

// Test server health
async function testServerHealth() {
  log('cyan', '\n🏥 Testing server health...');
  
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (response.ok) {
      log('green', '✅ Server is healthy');
    } else {
      log('yellow', '⚠️ Server health check failed, but server is responding');
    }
  } catch (error) {
    log('red', `❌ Server is not responding: ${error.message}`);
    log('yellow', '💡 Make sure to run "npm run dev" first');
    process.exit(1);
  }
}

// Main test runner
async function runTests() {
  log('magenta', '🚀 Starting Media Upload API Tests');
  log('blue', `📡 API Base: ${API_BASE}`);
  
  await testServerHealth();
  await createTestFiles();
  
  // Run all tests
  await testSingleUpload();
  await testMultipleUpload();
  await testLargeFileUpload();
  await testInvalidFileType();
  await testMediaListing();
  
  log('magenta', '\n🎉 All tests completed!');
  
  // Cleanup
  if (fs.existsSync(TEST_FILES_DIR)) {
    fs.rmSync(TEST_FILES_DIR, { recursive: true, force: true });
    log('green', '🧹 Test files cleaned up');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('red', `❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log('red', `❌ Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
