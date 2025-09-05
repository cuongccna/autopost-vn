// Script tạo test user trong Supabase Auth
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually since dotenv might not be available
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.error('Could not load .env.local file');
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Creating test user in Supabase Auth...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    const testEmail = 'test@autopostvn.com';
    const testPassword = 'TestPassword123!';
    
    console.log('1. Creating user in Supabase Auth...');
    
    // Create user using admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        role: 'free'
      }
    });
    
    if (authError) {
      console.error('Auth user creation error:', authError);
      return;
    }
    
    console.log('Auth user created:', authUser.user.id);
    
    // Wait a bit for auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('2. Creating user in autopostvn_users table...');
    
    // Now create user in our custom table
    const { data: customUser, error: customError } = await supabase
      .from('autopostvn_users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        full_name: 'Test User',
        user_role: 'free'
      })
      .select()
      .single();
    
    if (customError) {
      console.error('Custom user creation error:', customError);
      return;
    }
    
    console.log('Custom user created:', customUser);
    
    console.log('\n✅ Test user created successfully!');
    console.log('User ID:', authUser.user.id);
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    return authUser.user.id;
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
