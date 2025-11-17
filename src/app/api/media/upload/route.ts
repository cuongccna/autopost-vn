import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { localStorageService } from '@/lib/services/localStorageService';
import { insert } from '@/lib/db/postgres';
import { v4 as uuidv4 } from 'uuid';
import { 
  checkFFmpegInstalled, 
  getVideoInfo, 
  transcodeForInstagram, 
  validateInstagramVideo 
} from '@/lib/services/videoTranscoder';
import {
  getImageInfo,
  validateFacebookImage,
  validateInstagramImage,
  autoOptimizeForPlatform
} from '@/lib/services/imageValidator';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Disable body parser for file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for large file uploads

// Maximum file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [MEDIA UPLOAD] Request received');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('❌ [MEDIA UPLOAD] Unauthorized upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('👤 [MEDIA UPLOAD] User ID:', userId);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ [MEDIA UPLOAD] No file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 [MEDIA UPLOAD] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    console.log('🔍 [MEDIA UPLOAD] File type validation:', { 
      isImage, 
      isVideo, 
      fileType: file.type,
      allowedImages: ALLOWED_IMAGE_TYPES,
      allowedVideos: ALLOWED_VIDEO_TYPES
    });

    if (!isImage && !isVideo) {
      console.error('❌ [MEDIA UPLOAD] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images (jpg, png, gif, webp) and videos (mp4, mov, avi)' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    console.log('📏 [MEDIA UPLOAD] Size check:', {
      fileSize: file.size,
      maxSize,
      type: isImage ? 'image' : 'video',
      sizeOK: file.size <= maxSize
    });
    
    if (file.size > maxSize) {
      console.error('❌ [MEDIA UPLOAD] File too large:', {
        fileSize: file.size,
        maxSize,
        maxSizeMB: (maxSize / 1024 / 1024) + 'MB'
      });
      return NextResponse.json(
        { 
          error: `File too large. Maximum size: ${isImage ? '10MB' : '100MB'}`,
          maxSize: maxSize,
          actualSize: file.size
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = uuidv4().substring(0, 8);
    const extension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}-${randomStr}.${extension}`;

    console.log('🏷️ [MEDIA UPLOAD] Generated filename:', fileName);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    console.log('💾 [MEDIA UPLOAD] File converted to buffer, size:', buffer.length);

    // Image validation and optimization
    let imageOptimized = false;
    let imageInfo: any = null;
    let imageValidation: any = null;
    
    if (isImage) {
      console.log('🖼️ [IMAGE VALIDATE] Checking image quality and compatibility...');
      
      // Check if FFmpeg is available
      const hasFFmpeg = await checkFFmpegInstalled();
      
      if (hasFFmpeg) {
        try {
          // Save buffer to temp file for analysis
          const tempDir = os.tmpdir();
          const tempInputPath = path.join(tempDir, `upload_${uuidv4()}.${extension}`);
          fs.writeFileSync(tempInputPath, buffer);
          
          console.log('📊 [IMAGE VALIDATE] Analyzing image at:', tempInputPath);
          
          // Get image info
          imageInfo = await getImageInfo(tempInputPath);
          console.log('📐 [IMAGE VALIDATE] Image info:', {
            dimensions: `${imageInfo.width}x${imageInfo.height}`,
            format: imageInfo.format,
            aspectRatio: imageInfo.aspectRatio.toFixed(2),
            orientation: imageInfo.orientation,
            sizeMB: (imageInfo.size / 1024 / 1024).toFixed(2)
          });
          
          // Validate for Instagram (stricter requirements)
          const instagramValidation = await validateInstagramImage(tempInputPath);
          const facebookValidation = await validateFacebookImage(tempInputPath);
          
          console.log('✅ [IMAGE VALIDATE] Instagram validation:', {
            valid: instagramValidation.valid,
            errors: instagramValidation.errors,
            warnings: instagramValidation.warnings,
            needsOptimization: instagramValidation.needsOptimization
          });
          
          console.log('✅ [IMAGE VALIDATE] Facebook validation:', {
            valid: facebookValidation.valid,
            errors: facebookValidation.errors,
            warnings: facebookValidation.warnings,
            needsOptimization: facebookValidation.needsOptimization
          });
          
          // Store validation results
          imageValidation = {
            instagram: instagramValidation,
            facebook: facebookValidation
          };
          
          // Auto-optimize if needed (use Instagram requirements as they are stricter)
          if (instagramValidation.needsOptimization) {
            console.log('🔄 [IMAGE OPTIMIZE] Optimization required...');
            
            const tempOutputPath = path.join(tempDir, `optimized_${uuidv4()}.jpg`);
            
            // Optimize for Instagram (stricter requirements)
            const optimizeResult = await autoOptimizeForPlatform(
              tempInputPath,
              tempOutputPath,
              'instagram'
            );
            
            if (optimizeResult.success && optimizeResult.optimized) {
              console.log('✅ [IMAGE OPTIMIZE] Optimization complete');
              
              // Read optimized file
              buffer = fs.readFileSync(tempOutputPath);
              imageOptimized = true;
              
              // Clean up temp files
              fs.unlinkSync(tempInputPath);
              fs.unlinkSync(tempOutputPath);
              
              // Get updated image info
              const optimizedTempPath = path.join(tempDir, `final_${uuidv4()}.jpg`);
              fs.writeFileSync(optimizedTempPath, buffer);
              imageInfo = await getImageInfo(optimizedTempPath);
              fs.unlinkSync(optimizedTempPath);
              
              console.log('🎉 [IMAGE OPTIMIZE] Image optimized successfully:', {
                originalSize: file.size,
                newSize: buffer.length,
                savings: `${(((file.size - buffer.length) / file.size) * 100).toFixed(1)}%`,
                dimensions: `${imageInfo.width}x${imageInfo.height}`
              });
            } else {
              console.log('⚠️ [IMAGE OPTIMIZE] Using original image:', optimizeResult.error);
              fs.unlinkSync(tempInputPath);
            }
          } else {
            console.log('✅ [IMAGE VALIDATE] Image already optimal, no optimization needed');
            fs.unlinkSync(tempInputPath);
          }
          
        } catch (optimizeError) {
          console.error('⚠️ [IMAGE OPTIMIZE] Optimization failed:', optimizeError);
          console.log('📤 [IMAGE OPTIMIZE] Uploading original image anyway...');
        }
      } else {
        console.warn('⚠️ [IMAGE VALIDATE] FFmpeg not installed, skipping image validation');
        console.log('💡 [IMAGE VALIDATE] Install FFmpeg to enable automatic image optimization');
      }
    }

    // Video transcoding for Instagram compatibility
    let videoTranscoded = false;
    let videoInfo: any = null;
    
    if (isVideo) {
      console.log('🎬 [VIDEO TRANSCODE] Checking if video needs transcoding...');
      
      // Check if FFmpeg is available
      const hasFFmpeg = await checkFFmpegInstalled();
      
      if (hasFFmpeg) {
        try {
          // Save buffer to temp file for analysis
          const tempDir = os.tmpdir();
          const tempInputPath = path.join(tempDir, `upload_${uuidv4()}.${extension}`);
          fs.writeFileSync(tempInputPath, buffer);
          
          console.log('📊 [VIDEO TRANSCODE] Analyzing video at:', tempInputPath);
          
          // Get video info
          videoInfo = await getVideoInfo(tempInputPath);
          console.log('📹 [VIDEO TRANSCODE] Video info:', videoInfo);
          
          // Validate for Instagram
          const validation = await validateInstagramVideo(tempInputPath);
          console.log('✅ [VIDEO TRANSCODE] Validation result:', validation);
          
          if (!validation.valid || videoInfo.needsTranscoding) {
            console.log('🔄 [VIDEO TRANSCODE] Transcoding required...');
            
            const tempOutputPath = path.join(tempDir, `transcoded_${uuidv4()}.mp4`);
            
            // Transcode video
            const transcodedPath = await transcodeForInstagram(tempInputPath, tempOutputPath);
            console.log('✅ [VIDEO TRANSCODE] Transcoding complete:', transcodedPath);
            
            // Read transcoded file
            buffer = fs.readFileSync(transcodedPath);
            videoTranscoded = true;
            
            // Clean up temp files
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(transcodedPath);
            
            console.log('🎉 [VIDEO TRANSCODE] Video transcoded successfully, new size:', buffer.length);
          } else {
            console.log('✅ [VIDEO TRANSCODE] Video already compatible, no transcoding needed');
            // Clean up temp file
            fs.unlinkSync(tempInputPath);
          }
          
        } catch (transcodeError) {
          console.error('⚠️ [VIDEO TRANSCODE] Transcoding failed:', transcodeError);
          console.log('📤 [VIDEO TRANSCODE] Uploading original video anyway...');
          // Continue with original file if transcoding fails
        }
      } else {
        console.warn('⚠️ [VIDEO TRANSCODE] FFmpeg not installed, skipping transcoding');
        console.log('💡 [VIDEO TRANSCODE] Install FFmpeg to enable automatic video optimization');
      }
    }

    // Get workspace_id from session if available
    const workspaceId = (session.user as any).workspace_id || null;

    console.log('🏢 [MEDIA UPLOAD] Workspace ID:', workspaceId);

    // Upload to local storage
    let uploadResult;
    try {
      console.log('☁️ [MEDIA UPLOAD] Starting upload to local storage...');
      uploadResult = await localStorageService.uploadFile(
        buffer,
        file.name,
        file.type,
        {
          userId,
          workspaceId: workspaceId || undefined
        }
      );
      console.log('✅ [MEDIA UPLOAD] Local storage upload successful:', {
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size
      });
    } catch (uploadError) {
      console.error('❌ [MEDIA UPLOAD] Local storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error') },
        { status: 500 }
      );
    }

    const publicUrl = uploadResult.url;

    // Save to autopostvn_media table
    let mediaRecord;
    try {
      console.log('💾 [MEDIA UPLOAD] Saving to database...');
      const mediaRecords = await insert('autopostvn_media', {
        user_id: userId,
        workspace_id: workspaceId,
        file_name: file.name,
        file_path: uploadResult.path,
        file_type: file.type,
        file_size: uploadResult.size,
        media_type: isImage ? 'image' : 'video',
        public_url: publicUrl,
        status: 'uploaded',
        metadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
          storage_type: 'local',
          content_type: file.type,
          transcoded: videoTranscoded,
          optimized: imageOptimized,
          ...(videoInfo && {
            video_info: {
              duration: videoInfo.duration,
              width: videoInfo.width,
              height: videoInfo.height,
              codec: videoInfo.codec,
              bitrate: videoInfo.bitrate,
              fps: videoInfo.fps
            }
          }),
          ...(imageInfo && {
            image_info: {
              width: imageInfo.width,
              height: imageInfo.height,
              format: imageInfo.format,
              aspectRatio: imageInfo.aspectRatio,
              orientation: imageInfo.orientation
            }
          }),
          ...(imageValidation && {
            image_validation: {
              instagram: {
                valid: imageValidation.instagram.valid,
                errors: imageValidation.instagram.errors,
                warnings: imageValidation.instagram.warnings
              },
              facebook: {
                valid: imageValidation.facebook.valid,
                errors: imageValidation.facebook.errors,
                warnings: imageValidation.facebook.warnings
              }
            }
          })
        },
      });
      mediaRecord = mediaRecords[0];
      console.log('✅ [MEDIA UPLOAD] Database record created:', {
        id: mediaRecord?.id,
        media_type: isImage ? 'image' : 'video',
        file_name: file.name
      });
    } catch (dbError) {
      console.error('❌ [MEDIA UPLOAD] Failed to save media record:', dbError);
      // Don't fail the upload, just log the error
    }

    console.log('🎉 [MEDIA UPLOAD] Upload completed successfully:', {
      fileName: file.name,
      mediaType: isImage ? 'image' : 'video',
      size: file.size,
      url: publicUrl,
      transcoded: videoTranscoded,
      optimized: imageOptimized
    });

    return NextResponse.json({
      success: true,
      transcoded: videoTranscoded,
      optimized: imageOptimized,
      validation: imageValidation,
      file: {
        id: mediaRecord?.id, // Include media ID for reference
        name: file.name,
        type: file.type,
        size: buffer.length, // Use actual buffer size (might be different if transcoded)
        url: publicUrl,
        path: uploadResult.path, // Use the actual path from uploadResult
        bucket: 'local', // Add bucket identifier for compatibility
        mediaType: isImage ? 'image' : 'video',
      },
    });

  } catch (error) {
    console.error('❌ [MEDIA UPLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket and path are required' },
        { status: 400 }
      );
    }

    try {
      await localStorageService.deleteFile(path);
    } catch (error) {
      console.error('S3 delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
