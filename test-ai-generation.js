// Test AI generation after fixes
const testAIGeneration = async () => {
  try {
    console.log('🔍 Testing AI generation on localhost:3001...\n');
    
    const response = await fetch('http://localhost:3000/api/ai/caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test topic for AI generation',
        platform: 'facebook',
        tone: 'friendly',
        userId: 'cmixd9krk0000yfoq4suc5l5g' // The user ID that was causing UUID error
      })
    });

    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Raw response (first 500 chars):', text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('\n✅ AI Generation SUCCESS!');
        console.log('Generated caption:', data.caption);
      } else {
        console.log('\n❌ AI Generation FAILED!');
        console.log('Error:', data.error || data.details);
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON. Server returned HTML/non-JSON response');
      console.log('This usually means the API endpoint is not responding correctly');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testAIGeneration();
