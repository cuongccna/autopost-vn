const { createClient } = require('@supabase/supabase-js');

// Load environment variables  
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  console.log('🧪 Testing image upload with RLS policies...');
  
  try {
    // 1. Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ User not authenticated');
      console.log('💡 You need to be logged in to test upload');
      console.log('   Login to your app first, then run this test');
      return;
    }
    
    console.log(`✅ User authenticated: ${user.email}`);
    console.log(`📝 User ID: ${user.id}`);
    
    // 2. Test bucket access
    console.log('\n📂 Testing bucket access...');
    const { data: listData, error: listError } = await supabase.storage
      .from('post-images')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Bucket access error:', listError.message);
      return;
    }
    
    console.log('✅ Bucket access successful');
    
    // 3. Create a test file
    console.log('\n📁 Creating test file...');
    const testContent = 'Test image content';
    const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
    
    // 4. Test upload
    console.log('\n⬆️  Testing file upload...');
    const fileName = `${user.id}/test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, testFile);
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔧 RLS Policy Fix needed:');
        console.log('1. Go to Supabase Dashboard → Storage → post-images → Policies');
        console.log('2. Check INSERT policy allows authenticated users');
        console.log('3. Policy should be: bucket_id = \'post-images\'');
        console.log('4. Applied to: authenticated');
      }
      
      return;
    }
    
    console.log('✅ Upload successful!');
    console.log('📝 Upload data:', uploadData);
    
    // 5. Test public URL
    console.log('\n🔗 Testing public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);
    
    console.log('✅ Public URL generated:', publicUrl);
    
    // 6. Clean up - delete test file
    console.log('\n🗑️  Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('post-images')
      .remove([fileName]);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 All tests passed! Upload should work in your app now.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testUpload().catch(console.error);
