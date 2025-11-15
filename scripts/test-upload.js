// Test upload API endpoint
// Usage: node scripts/test-upload.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://autopostvn.cloud/api/media/upload';
const SESSION_TOKEN = process.env.SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE';

// Create a small test file
const testFilePath = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(testFilePath, 'Test upload content - ' + new Date().toISOString());

console.log('🧪 Testing upload to:', API_URL);
console.log('📁 Test file:', testFilePath);
console.log('');

// Read file
const fileContent = fs.readFileSync(testFilePath);
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

// Build multipart form data
const formData = [
  `--${boundary}`,
  `Content-Disposition: form-data; name="file"; filename="test.txt"`,
  'Content-Type: text/plain',
  '',
  fileContent.toString(),
  `--${boundary}--`
].join('\r\n');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(formData),
    'Cookie': `next-auth.session-token=${SESSION_TOKEN}`
  }
};

const req = https.request(API_URL, options, (res) => {
  console.log('📥 Response status:', res.statusCode);
  console.log('📋 Response headers:', res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📄 Response body:');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('');
        console.log('✅ Upload successful!');
        console.log('🔗 File URL:', json.file.url);
      } else {
        console.log('');
        console.log('❌ Upload failed');
        console.log('Error:', json.error);
      }
    } catch (e) {
      console.log('⚠️  Response is not JSON:');
      console.log(data.substring(0, 500)); // First 500 chars
      
      if (data.includes('<!DOCTYPE') || data.includes('<html')) {
        console.log('');
        console.log('❌ ERROR: Server returned HTML instead of JSON');
        console.log('This usually means:');
        console.log('1. API route not found (404)');
        console.log('2. Server error (500)');
        console.log('3. Next.js not serving API routes correctly');
      }
    }
    
    // Cleanup
    fs.unlinkSync(testFilePath);
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  fs.unlinkSync(testFilePath);
});

req.write(formData);
req.end();

console.log('⏳ Sending request...');
console.log('');
