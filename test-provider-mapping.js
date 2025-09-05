// Test script để verify provider mapping
const { PROVIDERS, mapProvidersToAPI } = require('./src/lib/constants.ts');

console.log('=== Provider Mapping Test ===');

// Test cases
const testCases = [
  ['fb'],
  ['ig'], 
  ['zalo'],
  ['fb', 'ig'],
  ['fb', 'zalo'],
  ['ig', 'zalo'],
  ['fb', 'ig', 'zalo'],
  [], // empty array
  ['unknown'] // invalid provider
];

testCases.forEach((input, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`Input: [${input.map(p => `'${p}'`).join(', ')}]`);
  
  try {
    const result = mapProvidersToAPI(input);
    console.log(`Output: [${result.map(p => `'${p}'`).join(', ')}]`);
    
    // Check validation
    const validProviders = ['facebook', 'instagram', 'zalo'];
    const isValid = result.every(p => validProviders.includes(p));
    console.log(`Valid: ${isValid ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
});

console.log('\n=== PROVIDERS Config ===');
Object.entries(PROVIDERS).forEach(([key, config]) => {
  console.log(`${key} -> ${config.apiKey}`);
});
