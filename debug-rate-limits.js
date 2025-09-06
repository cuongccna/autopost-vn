const { createClient } = require('@supabase/supabase-js')
// Remove dotenv dependency

// Get env from process.env directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Fallback values for local testing
const url = supabaseUrl || 'https://your-project.supabase.co'
const key = supabaseKey || 'your-service-role-key'

console.log('URL:', url)
console.log('Key available:', !!key)

const supabase = createClient(url, key)

async function checkRateLimits() {
  try {
    console.log('\n=== Checking Post Rate Limits ===')
    
    // Check rate limits table
    const { data: limits, error: limitsError } = await supabase
      .from('autopostvn_post_rate_limits')
      .select('*')
    
    if (limitsError) {
      console.error('Error fetching rate limits:', limitsError)
    } else {
      console.log('Rate limits configured:')
      console.table(limits)
    }
    
    // Check current user's usage
    const { data: usage, error: usageError } = await supabase
      .from('autopostvn_post_usage')  
      .select('*')
      .limit(10)
    
    if (usageError) {
      console.error('Error fetching usage:', usageError)
    } else {
      console.log('\nRecent post usage:')
      console.table(usage)
    }
    
    // Test rate limit function with 'free' role
    const testUserId = '4971d0b6-60bc-48f7-9962-e64fc0260c88' // Your user ID
    const { data: rateLimitResult, error: rpcError } = await supabase
      .rpc('check_post_rate_limit', {
        p_user_id: testUserId,
        p_user_role: 'free'
      })
    
    if (rpcError) {
      console.error('Error calling check_post_rate_limit:', rpcError)
    } else {
      console.log('\nRate limit check result (free role):')
      console.log(JSON.stringify(rateLimitResult, null, 2))
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

checkRateLimits()
