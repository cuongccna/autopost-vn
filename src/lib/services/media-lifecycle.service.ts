import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export enum MediaStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

export interface MediaLifecyclePolicy {
  archiveAfterDays: number;
  deleteArchivedAfterDays: number;
  keepHighEngagement: boolean;
  engagementThreshold: number;
}

export interface MediaItem {
  id: string;
  user_id: string;
  workspace_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  media_type: MediaType;
  status: MediaStatus;
  published_at?: string;
  archived_at?: string;
  deleted_at?: string;
  engagement_score: number;
  platform_urls: Record<string, string>;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const LIFECYCLE_POLICIES: Record<string, MediaLifecyclePolicy> = {
  free: {
    archiveAfterDays: 30,
    deleteArchivedAfterDays: 90,
    keepHighEngagement: true,
    engagementThreshold: 500,
  },
  professional: {
    archiveAfterDays: 90,
    deleteArchivedAfterDays: 365,
    keepHighEngagement: true,
    engagementThreshold: 1000,
  },
  enterprise: {
    archiveAfterDays: 180,
    deleteArchivedAfterDays: 0, // Never auto-delete
    keepHighEngagement: true,
    engagementThreshold: 0,
  }
};

/**
 * Get media items for a user with filters
 */
export async function getUserMedia(params: {
  userId: string;
  workspaceId?: string;
  mediaType?: MediaType;
  status?: MediaStatus;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  const {
    userId,
    workspaceId,
    mediaType,
    status,
    search,
    tags,
    limit = 50,
    offset = 0
  } = params;

  let query = supabase
    .from('autopostvn_media')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .neq('status', MediaStatus.DELETED)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  if (mediaType) {
    query = query.eq('media_type', mediaType);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('file_name', `%${search}%`);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Get user media error:', error);
    throw new Error('Failed to fetch media');
  }

  return {
    items: data as MediaItem[],
    total: count || 0,
    limit,
    offset
  };
}

/**
 * Get single media item
 */
export async function getMediaItem(mediaId: string, userId: string) {
  const { data, error } = await supabase
    .from('autopostvn_media')
    .select('*')
    .eq('id', mediaId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Get media item error:', error);
    throw new Error('Media not found');
  }

  return data as MediaItem;
}

/**
 * Update media status
 */
export async function updateMediaStatus(
  mediaId: string,
  userId: string,
  status: MediaStatus,
  additionalData?: Partial<MediaItem>
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  };

  // Set timestamps based on status
  if (status === MediaStatus.PUBLISHED && !additionalData?.published_at) {
    updateData.published_at = new Date().toISOString();
  }
  if (status === MediaStatus.ARCHIVED && !additionalData?.archived_at) {
    updateData.archived_at = new Date().toISOString();
  }
  if (status === MediaStatus.DELETED && !additionalData?.deleted_at) {
    updateData.deleted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('autopostvn_media')
    .update(updateData)
    .eq('id', mediaId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update media status error:', error);
    throw new Error('Failed to update media');
  }

  return data as MediaItem;
}

/**
 * Update platform URLs
 */
export async function updatePlatformUrls(
  mediaId: string,
  userId: string,
  platform: string,
  url: string
) {
  const media = await getMediaItem(mediaId, userId);
  const platformUrls = { ...media.platform_urls, [platform]: url };

  return updateMediaStatus(mediaId, userId, MediaStatus.PUBLISHED, {
    platform_urls: platformUrls
  });
}

/**
 * Update engagement score
 */
export async function updateEngagementScore(
  mediaId: string,
  userId: string,
  score: number
) {
  const { data, error } = await supabase
    .from('autopostvn_media')
    .update({
      engagement_score: score,
      updated_at: new Date().toISOString()
    })
    .eq('id', mediaId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update engagement score error:', error);
    throw new Error('Failed to update engagement score');
  }

  return data as MediaItem;
}

/**
 * Add tags to media
 */
export async function updateMediaTags(
  mediaId: string,
  userId: string,
  tags: string[]
) {
  const { data, error } = await supabase
    .from('autopostvn_media')
    .update({
      tags,
      updated_at: new Date().toISOString()
    })
    .eq('id', mediaId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update media tags error:', error);
    throw new Error('Failed to update tags');
  }

  return data as MediaItem;
}

/**
 * Soft delete media (mark as deleted, don't remove from storage yet)
 */
export async function softDeleteMedia(mediaId: string, userId: string) {
  return updateMediaStatus(mediaId, userId, MediaStatus.DELETED);
}

/**
 * Hard delete media (remove from storage and database)
 */
export async function hardDeleteMedia(mediaId: string, userId: string) {
  const media = await getMediaItem(mediaId, userId);

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove([media.storage_path]);

  if (storageError) {
    console.error('Delete from storage error:', storageError);
    throw new Error('Failed to delete media from storage');
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('autopostvn_media')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', userId);

  if (dbError) {
    console.error('Delete from database error:', dbError);
    throw new Error('Failed to delete media from database');
  }

  return { success: true };
}

/**
 * Archive old published media
 */
export async function archiveOldMedia(policy: MediaLifecyclePolicy) {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - policy.archiveAfterDays);

  const { data, error } = await supabase
    .from('autopostvn_media')
    .update({
      status: MediaStatus.ARCHIVED,
      archived_at: new Date().toISOString()
    })
    .eq('status', MediaStatus.PUBLISHED)
    .lt('published_at', archiveDate.toISOString())
    .is('archived_at', null)
    .select();

  if (error) {
    console.error('Archive media error:', error);
    throw new Error('Failed to archive media');
  }

  return data.length;
}

/**
 * Delete old archived media
 */
export async function deleteArchivedMedia(policy: MediaLifecyclePolicy) {
  if (policy.deleteArchivedAfterDays === 0) {
    return 0; // Don't auto-delete
  }

  const deleteDate = new Date();
  deleteDate.setDate(deleteDate.getDate() - policy.deleteArchivedAfterDays);

  // Get archived media to delete
  const { data: mediaToDelete, error: fetchError } = await supabase
    .from('autopostvn_media')
    .select('id, user_id, storage_path, engagement_score')
    .eq('status', MediaStatus.ARCHIVED)
    .lt('archived_at', deleteDate.toISOString());

  if (fetchError) {
    console.error('Fetch archived media error:', fetchError);
    throw new Error('Failed to fetch archived media');
  }

  let deletedCount = 0;

  for (const media of mediaToDelete || []) {
    // Keep high engagement media
    if (policy.keepHighEngagement && media.engagement_score >= policy.engagementThreshold) {
      continue;
    }

    try {
      await hardDeleteMedia(media.id, media.user_id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete media ${media.id}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Clean up media by user role
 */
export async function cleanupMediaByUserRole(userRole: string) {
  const policy = LIFECYCLE_POLICIES[userRole] || LIFECYCLE_POLICIES.free;

  const archivedCount = await archiveOldMedia(policy);
  const deletedCount = await deleteArchivedMedia(policy);

  return {
    userRole,
    archivedCount,
    deletedCount,
    policy
  };
}

/**
 * Get media storage stats
 */
export async function getMediaStats(userId: string, workspaceId?: string) {
  let query = supabase
    .from('autopostvn_media')
    .select('media_type, file_size, status')
    .eq('user_id', userId)
    .neq('status', MediaStatus.DELETED);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get media stats error:', error);
    throw new Error('Failed to get media stats');
  }

  const stats = {
    total: data.length,
    images: data.filter(m => m.media_type === MediaType.IMAGE).length,
    videos: data.filter(m => m.media_type === MediaType.VIDEO).length,
    uploaded: data.filter(m => m.status === MediaStatus.UPLOADED).length,
    published: data.filter(m => m.status === MediaStatus.PUBLISHED).length,
    archived: data.filter(m => m.status === MediaStatus.ARCHIVED).length,
    totalSize: data.reduce((sum, m) => sum + (m.file_size || 0), 0),
    imageSize: data.filter(m => m.media_type === MediaType.IMAGE).reduce((sum, m) => sum + (m.file_size || 0), 0),
    videoSize: data.filter(m => m.media_type === MediaType.VIDEO).reduce((sum, m) => sum + (m.file_size || 0), 0),
  };

  return stats;
}
