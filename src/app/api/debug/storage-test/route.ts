import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    console.log('🧪 Testing Supabase Storage...');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot list buckets: ' + listError.message,
        step: 'list_buckets'
      });
    }
    
    const postImagesBucket = buckets?.find(b => b.name === 'post-images');
    
    if (!postImagesBucket) {
      return NextResponse.json({
        success: false,
        error: 'post-images bucket not found',
        availableBuckets: buckets?.map(b => b.name) || [],
        step: 'check_bucket'
      });
    }
    
    // Test 2: List files in bucket (to test read access)
    const { data: files, error: accessError } = await supabase.storage
      .from('post-images')
      .list('', { limit: 1 });
    
    if (accessError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot access bucket: ' + accessError.message,
        bucket: postImagesBucket,
        step: 'access_bucket'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Storage test passed!',
      bucket: postImagesBucket,
      fileCount: files?.length || 0,
      testResult: {
        bucketExists: true,
        canAccess: true,
        canList: true
      }
    });
    
  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'unexpected_error'
    });
  }
}

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create a test file
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    const fileName = `debug/test-${Date.now()}.txt`;
    
    console.log('🔧 Testing upload with file:', fileName);
    
    // Test upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, testFile);
    
    if (uploadError) {
      return NextResponse.json({
        success: false,
        error: 'Upload failed: ' + uploadError.message,
        step: 'upload_test',
        details: uploadError
      });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);
    
    // Clean up - delete test file
    await supabase.storage
      .from('post-images')
      .remove([fileName]);
    
    return NextResponse.json({
      success: true,
      message: 'Upload test passed!',
      uploadData,
      publicUrl,
      testResult: {
        canUpload: true,
        canGetPublicUrl: true,
        canDelete: true
      }
    });
    
  } catch (error) {
    console.error('Upload test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'upload_unexpected_error'
    });
  }
}
