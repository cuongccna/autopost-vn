// Debug script để test database connection và AI usage service
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  try {
    console.log('\n=== Testing Database Connection ===');
    
    // Test 1: Check if autopostvn_users table exists
    console.log('\n1. Testing autopostvn_users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('autopostvn_users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Users table error:', usersError);
    } else {
      console.log('Users table exists, sample data:', usersData);
    }
    
    // Test 2: Check AI rate limits table
    console.log('\n2. Testing autopostvn_ai_rate_limits table...');
    const { data: rateLimitsData, error: rateLimitsError } = await supabase
      .from('autopostvn_ai_rate_limits')
      .select('*');
    
    if (rateLimitsError) {
      console.error('Rate limits table error:', rateLimitsError);
    } else {
      console.log('Rate limits data:', rateLimitsData);
    }
    
    // Test 3: Check RPC function
    console.log('\n3. Testing check_ai_rate_limit function...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_ai_rate_limit', {
        p_user_id: testUserId,
        p_user_role: 'free'
      });
    
    if (rpcError) {
      console.error('RPC function error:', rpcError);
    } else {
      console.log('RPC function result:', rpcData);
    }
    
    // Test 4: Try to create a test user
    console.log('\n4. Creating test user...');
    const { data: newUserData, error: createUserError } = await supabase
      .from('autopostvn_users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        user_role: 'free'
      })
      .select()
      .single();
      
    if (createUserError) {
      console.error('Create user error:', createUserError);
    } else {
      console.log('User created successfully:', newUserData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabaseConnection();
