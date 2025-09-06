const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

async function testStorageConnection() {
  console.log('🧪 Testing Supabase Storage connection...');
  
  // Load environment variables
  loadEnv();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
    return;
  }
  
  console.log('✅ Environment variables loaded');
  console.log('🔗 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
  
  try {
    // Test basic API connection with fetch
    const testUrl = `${supabaseUrl}/storage/v1/bucket`;
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      }
    });
    
    if (response.ok) {
      const buckets = await response.json();
      console.log('✅ Storage API connection successful');
      console.log('📦 Available buckets:', buckets.map(b => b.name));
      
      // Check if post-images bucket exists
      const postImagesBucket = buckets.find(b => b.name === 'post-images');
      if (postImagesBucket) {
        console.log('✅ post-images bucket found');
        console.log('🔧 Bucket config:', {
          name: postImagesBucket.name,
          public: postImagesBucket.public,
          file_size_limit: postImagesBucket.file_size_limit
        });
      } else {
        console.log('❌ post-images bucket NOT found');
        console.log('💡 Create the bucket in Supabase Dashboard');
      }
    } else {
      console.error('❌ Storage API connection failed');
      console.error('Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

// Simple upload test without authentication
async function testSimpleUpload() {
  console.log('\n🔧 Testing simple upload (requires authentication)...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Create a simple test file
  const testData = 'Test file content';
  const fileName = `test/simple-test-${Date.now()}.txt`;
  
  try {
    const uploadUrl = `${supabaseUrl}/storage/v1/object/post-images/${fileName}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'text/plain'
      },
      body: testData
    });
    
    if (response.ok) {
      console.log('✅ Simple upload test successful!');
      const result = await response.json();
      console.log('📝 Upload result:', result);
      
      // Test public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${fileName}`;
      console.log('🔗 Public URL:', publicUrl);
      
    } else {
      console.log('❌ Upload test failed');
      console.log('Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      
      if (response.status === 403) {
        console.log('\n💡 This is likely a RLS policy issue:');
        console.log('   1. Check your Storage policies in Supabase Dashboard');
        console.log('   2. Ensure INSERT policy allows authenticated/anon users');
        console.log('   3. Or try uploading through the actual app (with user login)');
      }
    }
    
  } catch (error) {
    console.error('❌ Upload test error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testStorageConnection();
  await testSimpleUpload();
  
  console.log('\n📋 Summary:');
  console.log('1. If bucket exists and connection works → Check RLS policies');
  console.log('2. If bucket missing → Create post-images bucket in Dashboard');
  console.log('3. If upload fails → Check authentication in your app');
}

runTests().catch(console.error);
