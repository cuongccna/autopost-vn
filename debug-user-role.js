// Debug script to check user role and AI limits in database

const { createClient } = require('@supabase/supabase-js');

// You need to set these values from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY_HERE';

async function debugUserRole() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const testUserId = '59dd7dcb-73b3-4b83-96a6-82811c1413fe';
  
  try {
    // Check user role
    console.log('🔍 Checking user role...');
    const { data: user, error: userError } = await supabase
      .from('autopostvn_users')
      .select('id, email, user_role')
      .eq('id', testUserId)
      .single();
    
    if (userError) {
      console.error('❌ User error:', userError);
    } else {
      console.log('✅ User data:', user);
    }
    
    // Check AI rate limits for each role
    console.log('\n🔍 Checking AI rate limits...');
    const { data: limits, error: limitsError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*')
      .order('user_role');
    
    if (limitsError) {
      console.error('❌ Limits error:', limitsError);
    } else {
      console.log('✅ AI Rate Limits:');
      limits.forEach(limit => {
        console.log(`  ${limit.user_role}: daily=${limit.daily_limit}, monthly=${limit.monthly_limit}`);
      });
    }
    
    // Call the database function directly
    console.log('\n🔍 Testing database function...');
    const { data: result, error: funcError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUserId,
        p_user_role: user?.user_role || 'free'
      });
    
    if (funcError) {
      console.error('❌ Function error:', funcError);
    } else {
      console.log('✅ Database function result:', result);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

debugUserRole();
