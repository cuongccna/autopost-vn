import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Bucket name for storing post images
export const POST_IMAGES_BUCKET = 'post-images'

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID for organizing files
 * @returns Promise with upload result and public URL
 */
export async function uploadImage(file: File, userId: string) {
  try {
    // Ensure bucket exists before uploading
    await ensureBucketExists()
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ file PNG, JPG, JPEG, WEBP')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('Kích thước file không được vượt quá 5MB')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Lỗi upload: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(POST_IMAGES_BUCKET)
      .getPublicUrl(fileName)

    return {
      success: true,
      path: data.path,
      publicUrl,
      fileName: file.name,
      size: file.size
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Delete an image from Supabase Storage
 * @param path - The storage path of the image
 * @returns Promise with deletion result
 */
export async function deleteImage(path: string) {
  try {
    const { error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .remove([path])

    if (error) {
      throw new Error(`Lỗi xóa file: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get signed URL for private access (if needed)
 * @param path - The storage path of the image
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Lỗi tạo signed URL: ${error.message}`)
    }

    return {
      success: true,
      signedUrl: data.signedUrl
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Initialize storage bucket if it doesn't exist
 * This should be called once during setup
 */
export async function initializeStorage() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Lỗi kiểm tra bucket: ${listError.message}`)
    }

    const bucketExists = buckets?.some(bucket => bucket.name === POST_IMAGES_BUCKET)

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(POST_IMAGES_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        throw new Error(`Lỗi tạo bucket: ${createError.message}`)
      }


    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ Lỗi khởi tạo storage:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Ensure bucket exists before performing operations
 * Auto-creates bucket if it doesn't exist
 */
async function ensureBucketExists() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.warn('Cannot check bucket existence, proceeding with upload')
      return
    }

    const bucketExists = buckets?.some(bucket => bucket.name === POST_IMAGES_BUCKET)

    if (!bucketExists) {
      // Try to create bucket
      const { error: createError } = await supabase.storage.createBucket(POST_IMAGES_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError && !createError.message.includes('already exists')) {
        console.warn('Cannot create bucket automatically:', createError.message)
      }
    }
  } catch (error) {
    console.warn('Error ensuring bucket exists:', error)
    // Continue with upload attempt even if bucket check fails
  }
}
