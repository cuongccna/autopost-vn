import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { localStorageService } from '@/lib/services/localStorageService';
import { insert, query } from '@/lib/db/postgres';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserMedia,
  getMediaItem,
  updateMediaStatus,
  updateMediaTags,
  softDeleteMedia,
  hardDeleteMedia,
  getMediaStats,
  MediaStatus,
  MediaType
} from '@/lib/services/media-lifecycle.service';

/**
 * POST /api/media - Upload media files using local storage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const workspaceId = formData.get('workspaceId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadResults = [];
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

    for (const file of files) {
      try {
        // Validate file type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: 'Invalid file type. Allowed: images (jpg, png, gif, webp) and videos (mp4, mov, avi)'
          });
          continue;
        }

        // Validate file size
        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.size > maxSize) {
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: `File too large. Maximum size: ${isImage ? '10MB' : '100MB'}`
          });
          continue;
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
          });
          continue;
        }

        const publicUrl = uploadResult.url;
        const mediaType = isImage ? 'image' : 'video';

        // Save to database
        let mediaRecord;
        try {
          const mediaRecords = await insert('autopostvn_media', {
            user_id: userId,
            workspace_id: workspaceId,
            file_name: file.name,
            file_path: uploadResult.path,
            file_type: file.type,
            file_size: uploadResult.size,
            media_type: mediaType,
            storage_path: uploadResult.path,
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
          // Continue without failing the upload
        }

        uploadResults.push({
          fileName: file.name,
          success: true,
          mediaId: mediaRecord?.id,
          publicUrl: publicUrl,
          mediaType
        });

      } catch (error) {
        console.error('Upload error for file:', file.name, error);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: uploadResults,
      totalFiles: files.length,
      successCount: uploadResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('POST media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media - List user's media with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);

    const params = {
      userId,
      workspaceId: searchParams.get('workspaceId') || undefined,
      mediaType: searchParams.get('mediaType') as MediaType | undefined,
      status: searchParams.get('status') as MediaStatus | undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await getUserMedia(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/media - Update media (status, tags, etc)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { mediaId, status, tags, metadata } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    let result;

    // Update status
    if (status) {
      result = await updateMediaStatus(mediaId, userId, status, metadata);
    }

    // Update tags
    if (tags) {
      result = await updateMediaTags(mediaId, userId, tags);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media - Delete media (soft or hard)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const hard = searchParams.get('hard') === 'true';

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Check if media is used in any pending or draft posts
    const mediaItem = await getMediaItem(mediaId, userId);
    if (mediaItem) {
      const mediaUrl = mediaItem.public_url;
      const usageCheck = await query(
        `SELECT id, title, status FROM autopostvn_posts 
         WHERE $1 = ANY(media_urls) 
         AND status IN ('pending', 'draft')
         LIMIT 1`,
        [mediaUrl]
      );

      if (usageCheck.rows.length > 0) {
        const post = usageCheck.rows[0];
        return NextResponse.json(
          { 
            error: `Không thể xóa media này vì đang được sử dụng trong bài viết "${post.title}" (Trạng thái: ${post.status}). Vui lòng xóa bài viết hoặc gỡ media khỏi bài viết trước.` 
          },
          { status: 400 }
        );
      }
    }

    if (hard) {
      // Permanently delete from storage and database
      await hardDeleteMedia(mediaId, userId);
    } else {
      // Soft delete (mark as deleted)
      await softDeleteMedia(mediaId, userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete media' },
      { status: 500 }
    );
  }
}
