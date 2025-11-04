import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
