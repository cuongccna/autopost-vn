// Test provider mapping với TypeScript
import { PROVIDERS, mapProvidersToAPI } from './src/lib/constants';

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
  ['unknown'] as string[] // invalid provider
];

testCases.forEach((input, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`Input:  ${JSON.stringify(input)}`);
  try {
    const output = mapProvidersToAPI(input);
    console.log(`Output: ${JSON.stringify(output)}`);
    
    // Validate output
    const validProviders = ['facebook', 'instagram', 'zalo'];
    const isValid = output.every(provider => validProviders.includes(provider) || provider === 'unknown');
    console.log(`Valid:  ${isValid ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`Error:  ❌ ${error instanceof Error ? error.message : String(error)}`);
  }
});

console.log('\n=== API Validation Test ===');
// Test validation như trong API
const validProviders = ['facebook', 'instagram', 'zalo'];

testCases.slice(0, -2).forEach((input, index) => { // exclude empty and unknown
  const mapped = mapProvidersToAPI(input);
  const isValidForAPI = mapped.every(provider => validProviders.includes(provider));
  console.log(`${input.join(',')} → ${mapped.join(',')} → ${isValidForAPI ? '✅ PASS' : '❌ FAIL'}`);
});
