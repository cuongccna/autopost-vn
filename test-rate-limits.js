const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRateLimits() {
  try {
    // Check post rate limits
    const { data: rateLimits, error: limitsError } = await supabase
      .from('autopostvn_post_rate_limits')
      .select('*');
    
    if (limitsError) {
      console.error('Error fetching rate limits:', limitsError);
      return;
    }
    
    console.log('Current post rate limits:');
    console.table(rateLimits);
    
    // Test the rate limit function for professional user
    const testUserId = 'ed3c77ff-5a88-4f9c-ac15-7b03cfe4c99b'; // Your user ID
    
    const { data: checkResult, error: checkError } = await supabase
      .rpc('check_post_rate_limit', {
        p_user_id: testUserId,
        p_user_role: 'professional'
      });
    
    if (checkError) {
      console.error('Error checking rate limit:', checkError);
      return;
    }
    
    console.log('Rate limit check for professional user:');
    console.log(checkResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRateLimits();
