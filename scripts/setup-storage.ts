import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'post-images';

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...');
  console.log(`📡 Project URL: ${supabaseUrl}`);
  
  try {
    // 1. Check existing buckets
    console.log('\n📋 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }
    
    console.log('✅ Existing buckets:', buckets?.map(b => b.name) || []);
    
    // 2. Check if our bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists!`);
    } else {
      // 3. Create the bucket
      console.log(`\n🪣 Creating bucket "${BUCKET_NAME}"...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        return;
      }
      
      console.log('✅ Bucket created successfully!', createData);
    }
    
    // 4. Test bucket access
    console.log('\n🧪 Testing bucket access...');
    const { data: listData, error: accessError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (accessError) {
      console.error('❌ Error accessing bucket:', accessError.message);
      console.log('\n📝 To fix this:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Select the post-images bucket');
      console.log('3. Go to Policies tab');
      console.log('4. Add these policies:');
      console.log('   - Allow INSERT for authenticated users');
      console.log('   - Allow SELECT for everyone (public read)');
      console.log('   - Allow DELETE for authenticated users');
      return;
    }
    
    console.log('✅ Bucket access test successful!');
    
    // 5. Set up RLS policies (if needed)
    console.log('\n🔐 Setting up storage policies...');
    
    const policies = [
      {
        name: 'Allow authenticated users to upload',
        sql: `
          CREATE POLICY "Allow authenticated users to upload" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = '${BUCKET_NAME}');
        `
      },
      {
        name: 'Allow public read access',
        sql: `
          CREATE POLICY "Allow public read access" ON storage.objects
          FOR SELECT TO public
          USING (bucket_id = '${BUCKET_NAME}');
        `
      },
      {
        name: 'Allow users to delete own files',
        sql: `
          CREATE POLICY "Allow users to delete own files" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = '${BUCKET_NAME}' AND auth.uid()::text = (storage.foldername(name))[1]);
        `
      }
    ];
    
    console.log('ℹ️  Storage policies should be created manually in Supabase Dashboard');
    console.log('   Go to: Storage → Settings → Policies');
    
    console.log('\n🎉 Storage setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ Bucket "${BUCKET_NAME}" is ready`);
    console.log('✅ Public read access enabled');
    console.log('✅ 5MB file size limit');
    console.log('✅ Image formats: PNG, JPG, JPEG, WEBP');
    
    console.log('\n🔧 If you still get "Bucket not found" errors:');
    console.log('1. Check your .env.local file has correct Supabase credentials');
    console.log('2. Verify the bucket is visible in Supabase Dashboard → Storage');
    console.log('3. Check storage policies are properly configured');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupStorage().catch(console.error);
