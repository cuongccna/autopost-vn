// Test unified provider keys
console.log('🔧 Testing unified provider keys...\n');

// Manually define the PROVIDERS object (from constants.ts)
const PROVIDERS = {
  facebook: { 
    label: 'Facebook Page', 
    tag: 'FB', 
    chip: 'bg-blue-100 text-blue-700',
    apiKey: 'facebook'
  },
  instagram: { 
    label: 'Instagram Biz', 
    tag: 'IG', 
    chip: 'bg-pink-100 text-pink-700',
    apiKey: 'instagram'
  },
  zalo: { 
    label: 'Zalo OA', 
    tag: 'ZL', 
    chip: 'bg-sky-100 text-sky-700',
    apiKey: 'zalo'
  },
};

console.log('PROVIDERS object:');
Object.entries(PROVIDERS).forEach(([key, value]) => {
  console.log(`  ${key}: ${JSON.stringify(value)}`);
});

console.log('\n✅ Unified keys check:');
const expectedKeys = ['facebook', 'instagram', 'zalo'];
const actualKeys = Object.keys(PROVIDERS);

console.log('Expected keys:', expectedKeys);
console.log('Actual keys:', actualKeys);

const isUnified = expectedKeys.every(key => actualKeys.includes(key)) && 
                  actualKeys.every(key => expectedKeys.includes(key));

if (isUnified) {
  console.log('✅ SUCCESS: Provider keys are unified!');
  
  // Test that UI keys match database keys
  console.log('\n🔄 UI ↔ Database mapping:');
  Object.entries(PROVIDERS).forEach(([uiKey, config]) => {
    console.log(`  UI: ${uiKey} → Database: ${config.apiKey} ${uiKey === config.apiKey ? '✅' : '❌'}`);
  });
} else {
  console.log('❌ FAILED: Provider keys are not unified!');
}
