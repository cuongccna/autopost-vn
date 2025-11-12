import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { localStorageService } from '@/lib/services/localStorageService';
import { insert } from '@/lib/db/postgres';
import { v4 as uuidv4 } from 'uuid';

// Maximum file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images (jpg, png, gif, webp) and videos (mp4, mov, avi)' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get workspace_id from session if available
    const workspaceId = (session.user as any).workspace_id || null;

    // Upload to local storage
    let uploadResult;
    try {
      uploadResult = await localStorageService.uploadFile(
        buffer,
        file.name,
        file.type,
        {
          userId,
          workspaceId: workspaceId || undefined
        }
      );
    } catch (uploadError) {
      console.error('Local storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error') },
        { status: 500 }
      );
    }

    const publicUrl = uploadResult.url;

    // Save to autopostvn_media table
    let mediaRecord;
    try {
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
        },
      });
      mediaRecord = mediaRecords[0];
    } catch (dbError) {
      console.error('Failed to save media record:', dbError);
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      file: {
        id: mediaRecord?.id, // Include media ID for reference
        name: file.name,
        type: file.type,
        size: file.size,
        url: publicUrl,
        path: fileName,
        mediaType: isImage ? 'image' : 'video',
      },
    });

  } catch (error) {
    console.error('Media upload error:', error);
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
