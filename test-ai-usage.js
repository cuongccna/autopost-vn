// Quick test to verify AI usage stats API
const testAIUsageAPI = async () => {
  try {
    console.log('Testing AI usage stats API...');
    
    const response = await fetch('http://localhost:3000/api/ai/usage-stats');
    const result = await response.text();
    
    console.log('Raw response:', result);
    
    try {
      const parsed = JSON.parse(result);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Not JSON response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAIUsageAPI();
