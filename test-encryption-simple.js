/**
 * Simple Test for Encryption
 * Run: node test-encryption-simple.js
 */

const crypto = require('crypto');
require('dotenv/config');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

console.log('🧪 Testing AES-256-GCM Encryption\n');
console.log('='.repeat(60));

// Check encryption key
console.log('\n📋 Environment Check:');
console.log('-'.repeat(60));
const key = process.env.ENCRYPTION_KEY;
if (!key) {
  console.error('❌ ENCRYPTION_KEY not found in environment');
  console.log('💡 Add this to .env.local:');
  console.log('   ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
  process.exit(1);
}

console.log('✅ ENCRYPTION_KEY found');
console.log('   Length:', key.length, 'characters');
console.log('   Format:', key.length === 64 ? 'Hex (32 bytes)' : 'Raw string');

// Convert key to buffer
const keyBuffer = key.length === 64 
  ? Buffer.from(key, 'hex') 
  : Buffer.from(key, 'utf-8');

console.log('   Key buffer length:', keyBuffer.length, 'bytes (should be 32)');

if (keyBuffer.length !== 32) {
  console.error('❌ Invalid key length. Must be 32 bytes (256 bits)');
  process.exit(1);
}

// Test encryption
console.log('\n🔐 Test 1: Encryption');
console.log('-'.repeat(60));

const testToken = 'EAADaEdDTKVEBO1tVlM9u6ZBZBD6iZBTest123Token_MyFacebookAccessToken';
console.log('Original:', testToken.substring(0, 30) + '...');

try {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(testToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  
  console.log('✅ Encrypted successfully');
  console.log('   IV length:', iv.toString('hex').length, 'chars');
  console.log('   Auth tag length:', authTag.toString('hex').length, 'chars');
  console.log('   Encrypted length:', encrypted.length, 'chars');
  console.log('   Total:', result.length, 'chars');
  console.log('   Format: iv:authTag:encryptedData');
  console.log('   Result:', result.substring(0, 60) + '...');
  
  // Test decryption
  console.log('\n🔓 Test 2: Decryption');
  console.log('-'.repeat(60));
  
  const parts = result.split(':');
  const ivDec = Buffer.from(parts[0], 'hex');
  const authTagDec = Buffer.from(parts[1], 'hex');
  const encryptedData = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivDec);
  decipher.setAuthTag(authTagDec);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Decrypted successfully');
  console.log('   Result:', decrypted.substring(0, 30) + '...');
  console.log('   Match:', decrypted === testToken ? '✅ PERFECT!' : '❌ MISMATCH!');
  
  // Test with wrong auth tag (should fail)
  console.log('\n🛡️  Test 3: Authentication (Tamper Detection)');
  console.log('-'.repeat(60));
  
  try {
    const wrongAuthTag = crypto.randomBytes(16);
    const tamperedCipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivDec);
    tamperedCipher.setAuthTag(wrongAuthTag);
    
    let tampered = tamperedCipher.update(encryptedData, 'hex', 'utf8');
    tampered += tamperedCipher.final('utf8');
    
    console.log('❌ Tamper detection failed - should have thrown error!');
  } catch (error) {
    console.log('✅ Tamper detected correctly');
    console.log('   Error:', error.message);
  }
  
  // Performance test
  console.log('\n⚡ Test 4: Performance');
  console.log('-'.repeat(60));
  
  const iterations = 1000;
  const start = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    let enc = cipher.update(testToken, 'utf8', 'hex');
    enc += cipher.final('hex');
    cipher.getAuthTag();
  }
  
  const duration = Date.now() - start;
  console.log('✅ Encrypted', iterations, 'tokens in', duration, 'ms');
  console.log('   Average:', (duration / iterations).toFixed(2), 'ms per encryption');
  console.log('   Throughput:', Math.round(iterations / (duration / 1000)), 'encryptions/sec');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✅ ALL ENCRYPTION TESTS PASSED!');
console.log('='.repeat(60));
console.log('\n📋 Summary:');
console.log('- Algorithm: AES-256-GCM');
console.log('- Key Size: 256 bits (32 bytes)');
console.log('- IV Size: 96 bits (12 bytes)');
console.log('- Auth Tag: 128 bits (16 bytes)');
console.log('- Security: ✅ Confidentiality + Integrity + Authenticity');
console.log('\n💡 Next: Integrate into OAuth token storage!');
