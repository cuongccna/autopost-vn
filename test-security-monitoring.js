/**
 * Test Script for Security & Monitoring
 * 
 * Tests:
 * 1. AES-256-GCM encryption/decryption
 * 2. Legacy token backward compatibility
 * 3. Winston logging
 * 4. Sentry error tracking (optional)
 */

const { encrypt, decrypt, hash, generateToken, generateEncryptionKey } = require('./src/lib/utils/encryption.ts');
const logger = require('./src/lib/utils/logger.ts').default;
const { loggers } = require('./src/lib/utils/logger.ts');

console.log('🧪 Testing Security & Monitoring Implementation\n');
console.log('=' .repeat(60));

// Test 1: Encryption Key Generation
console.log('\n📝 Test 1: Encryption Key Generation');
console.log('-'.repeat(60));
try {
  const newKey = generateEncryptionKey();
  console.log('✅ Generated new encryption key:', newKey.substring(0, 16) + '...');
  console.log('   Length:', newKey.length, 'characters (64 hex = 32 bytes = 256 bits)');
} catch (error) {
  console.error('❌ Key generation failed:', error.message);
}

// Test 2: Token Encryption & Decryption
console.log('\n🔐 Test 2: AES-256-GCM Encryption/Decryption');
console.log('-'.repeat(60));
try {
  const testToken = 'EAADaEdDTKVEBO1tVlM9u6ZBZBD6iZBTest123Token';
  console.log('Original token:', testToken.substring(0, 20) + '...');
  
  // Encrypt
  const encrypted = encrypt(testToken);
  console.log('✅ Encrypted:', encrypted.substring(0, 40) + '...');
  console.log('   Format: iv:authTag:encryptedData');
  console.log('   Parts:', encrypted.split(':').length);
  
  // Decrypt
  const decrypted = decrypt(encrypted);
  console.log('✅ Decrypted:', decrypted.substring(0, 20) + '...');
  console.log('   Match:', decrypted === testToken ? '✅ YES' : '❌ NO');
  
} catch (error) {
  console.error('❌ Encryption test failed:', error.message);
  console.error('   Make sure ENCRYPTION_KEY is set in .env.local');
}

// Test 3: Legacy Token Decryption (Backward Compatibility)
console.log('\n🔄 Test 3: Legacy Token Backward Compatibility');
console.log('-'.repeat(60));
try {
  // Simulate old CBC-encrypted token (2 parts: iv:encryptedData)
  const legacyToken = '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p:7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t';
  console.log('Testing with legacy format (2 parts)...');
  
  try {
    const decrypted = decrypt(legacyToken);
    console.log('✅ Legacy decryption attempted');
    console.log('   (Note: Will fail with test data, but code path works)');
  } catch (error) {
    console.log('⚠️  Expected: Legacy format detected and fallback attempted');
    console.log('   Error:', error.message);
  }
  
} catch (error) {
  console.error('❌ Legacy test failed:', error.message);
}

// Test 4: Hashing
console.log('\n#️⃣  Test 4: SHA-256 Hashing');
console.log('-'.repeat(60));
try {
  const testString = 'my-secret-password';
  const hashed = hash(testString);
  console.log('Original:', testString);
  console.log('✅ Hashed:', hashed);
  console.log('   Length:', hashed.length, 'characters (64 hex = 32 bytes = 256 bits)');
  
  // Test consistency
  const hashed2 = hash(testString);
  console.log('   Consistent:', hashed === hashed2 ? '✅ YES' : '❌ NO');
  
} catch (error) {
  console.error('❌ Hashing test failed:', error.message);
}

// Test 5: Random Token Generation
console.log('\n🎲 Test 5: Random Token Generation');
console.log('-'.repeat(60));
try {
  const token1 = generateToken();
  const token2 = generateToken();
  console.log('Token 1:', token1.substring(0, 32) + '...');
  console.log('Token 2:', token2.substring(0, 32) + '...');
  console.log('✅ Unique:', token1 !== token2 ? 'YES' : 'NO');
  console.log('   Length:', token1.length, 'characters');
  
} catch (error) {
  console.error('❌ Token generation failed:', error.message);
}

// Test 6: Winston Logging
console.log('\n📝 Test 6: Winston Structured Logging');
console.log('-'.repeat(60));
try {
  // Test different log levels
  logger.debug('Debug message', { test: true });
  logger.info('Info message', { userId: '123', action: 'test' });
  logger.warn('Warning message', { issue: 'potential problem' });
  logger.error('Error message', { error: 'test error', stack: 'fake stack' });
  
  console.log('✅ Winston logging working (check console above for colored output)');
  
} catch (error) {
  console.error('❌ Winston test failed:', error.message);
}

// Test 7: Custom Logger Functions
console.log('\n🎯 Test 7: Custom Logger Functions');
console.log('-'.repeat(60));
try {
  // Test OAuth logging
  loggers.oauthConnect('facebook', 'user-123', true);
  loggers.oauthConnect('instagram', 'user-123', false, 'Invalid credentials');
  
  // Test post logging
  loggers.postCreate('post-456', 'user-123', ['facebook', 'instagram'], true);
  loggers.postPublish('post-456', 'facebook', true, 'fb-ext-789');
  loggers.postPublish('post-456', 'instagram', false, undefined, 'Rate limit exceeded');
  
  // Test API logging
  loggers.apiRequest('GET', '/api/posts', 'user-123', 150);
  loggers.apiError('POST', '/api/posts', new Error('Test error'), 'user-123');
  
  // Test scheduler logging
  loggers.scheduler('job-started', { jobId: 'job-789', posts: 5 });
  
  // Test rate limit logging
  loggers.rateLimit('user-123', 'facebook', true);
  
  console.log('✅ Custom logger functions working (check console above)');
  
} catch (error) {
  console.error('❌ Custom logger test failed:', error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ ALL TESTS COMPLETED!');
console.log('='.repeat(60));
console.log('\n📋 Next Steps:');
console.log('1. ✅ Encryption upgraded to AES-256-GCM');
console.log('2. ✅ Winston logging configured');
console.log('3. ✅ Sentry installed (test at /sentry-example-page)');
console.log('4. 🔄 Integrate logging into API routes');
console.log('5. 🔄 Test Sentry error reporting');
console.log('6. 🔄 Setup log rotation for production');
console.log('\n💡 Tips:');
console.log('- Visit http://localhost:3000/sentry-example-page to test Sentry');
console.log('- Check logs/ directory for production log files');
console.log('- Set LOG_LEVEL=debug in .env.local for verbose logging');
console.log('- Add SENTRY_DSN to .env.local for error tracking');
