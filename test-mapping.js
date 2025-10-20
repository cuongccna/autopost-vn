// Test provider mapping
const { SOCIAL_MEDIA_TYPES } = require('./src/lib/constants.ts');

console.log('🧪 Testing provider mapping...\n');

const testChannels = ['facebook', 'instagram'];
console.log('📥 Input channels:', testChannels);

// Simulate mapProvidersToAPI
const mapped = testChannels.map(channel => {
  const config = SOCIAL_MEDIA_TYPES[channel];
  return config?.apiKey || channel;
});

console.log('📤 Mapped providers:', mapped);
console.log('\n✅ Expected: ["facebook_page", "instagram"]');
console.log('❌ Old behavior: ["facebook", "instagram"]');
