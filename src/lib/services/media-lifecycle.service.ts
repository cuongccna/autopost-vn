import { query, insert, update } from '@/lib/db/postgres';
import { localStorageService } from './localStorageService';

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

export interface MediaItem {
  id: string;
  user_id: string;
  workspace_id?: string;
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

export interface MediaLifecyclePolicy {
  userRole: string;
  maxStorageGB: number;
  maxFiles: number;
  retentionDays: number;
  autoArchiveDays: number;
  autoDeleteDays: number;
}

export const LIFECYCLE_POLICIES: Record<string, MediaLifecyclePolicy> = {
  free: {
    userRole: 'free',
    maxStorageGB: 1,
    maxFiles: 100,
    retentionDays: 30,
    autoArchiveDays: 7,
    autoDeleteDays: 30
  },
  pro: {
    userRole: 'pro',
    maxStorageGB: 10,
    maxFiles: 1000,
    retentionDays: 90,
    autoArchiveDays: 30,
    autoDeleteDays: 90
  },
  enterprise: {
    userRole: 'enterprise',
    maxStorageGB: 100,
    maxFiles: 10000,
    retentionDays: 365,
    autoArchiveDays: 90,
    autoDeleteDays: 365
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

  // Build WHERE conditions
  let whereConditions = ['user_id = $1', "status != 'deleted'"];
  let paramValues: any[] = [userId];
  let paramIndex = 2;

  if (workspaceId) {
    whereConditions.push(`workspace_id = $${paramIndex}`);
    paramValues.push(workspaceId);
    paramIndex++;
  }

  if (mediaType) {
    whereConditions.push(`media_type = $${paramIndex}`);
    paramValues.push(mediaType);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    paramValues.push(status);
    paramIndex++;
  }

  if (search) {
    whereConditions.push(`file_name ILIKE $${paramIndex}`);
    paramValues.push(`%${search}%`);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    whereConditions.push(`tags && $${paramIndex}`);
    paramValues.push(tags);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM autopostvn_media
    WHERE ${whereClause}
  `;

  const countResult = await query(countQuery, paramValues);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated data
  const dataQuery = `
    SELECT *
    FROM autopostvn_media
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  paramValues.push(limit, offset);
  const dataResult = await query(dataQuery, paramValues);

  return {
    items: dataResult.rows as MediaItem[],
    total,
    limit,
    offset
  };
}

/**
 * Get single media item
 */
export async function getMediaItem(mediaId: string, userId: string) {
  const result = await query(
    'SELECT * FROM autopostvn_media WHERE id = $1 AND user_id = $2 LIMIT 1',
    [mediaId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Media not found');
  }

  return result.rows[0] as MediaItem;
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

  const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 3}`).join(', ');
  const values = [mediaId, userId, ...Object.values(updateData)];

  const updateQuery = `
    UPDATE autopostvn_media
    SET ${updateFields}
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    throw new Error('Media not found or update failed');
  }

  return result.rows[0] as MediaItem;
}

/**
 * Update platform URLs
 */
export async function updatePlatformUrls(
  mediaId: string,
  userId: string,
  platformUrls: Record<string, string>
) {
  const result = await query(
    'UPDATE autopostvn_media SET platform_urls = $3, updated_at = $4 WHERE id = $1 AND user_id = $2 RETURNING *',
    [mediaId, userId, JSON.stringify(platformUrls), new Date().toISOString()]
  );

  if (result.rows.length === 0) {
    throw new Error('Media not found or update failed');
  }

  return result.rows[0];
}

/**
 * Update engagement score
 */
export async function updateEngagementScore(mediaId: string, userId: string, score: number) {
  const result = await query(
    'UPDATE autopostvn_media SET engagement_score = $3, updated_at = $4 WHERE id = $1 AND user_id = $2 RETURNING *',
    [mediaId, userId, score, new Date().toISOString()]
  );

  if (result.rows.length === 0) {
    throw new Error('Media not found or update failed');
  }

  return result.rows[0];
}

/**
 * Update media tags
 */
export async function updateMediaTags(mediaId: string, userId: string, tags: string[]) {
  const result = await query(
    'UPDATE autopostvn_media SET tags = $3, updated_at = $4 WHERE id = $1 AND user_id = $2 RETURNING *',
    [mediaId, userId, tags, new Date().toISOString()]
  );

  if (result.rows.length === 0) {
    throw new Error('Media not found or update failed');
  }

  return result.rows[0];
}

/**
 * Soft delete media (mark as deleted)
 */
export async function softDeleteMedia(mediaId: string, userId: string) {
  return updateMediaStatus(mediaId, userId, MediaStatus.DELETED);
}

/**
 * Hard delete media (remove from storage and database)
 */
export async function hardDeleteMedia(mediaId: string, userId: string) {
  // Get media item first
  const media = await getMediaItem(mediaId, userId);
  
  // Delete from local storage
  try {
    await localStorageService.deleteFile(media.storage_path);
  } catch (error) {
    console.error('Failed to delete from local storage:', error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  const result = await query(
    'DELETE FROM autopostvn_media WHERE id = $1 AND user_id = $2 RETURNING *',
    [mediaId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Media not found or delete failed');
  }

  return { success: true, deletedMedia: result.rows[0] };
}

/**
 * Archive old media based on policy
 */
export async function archiveOldMedia(policy: MediaLifecyclePolicy) {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - policy.autoArchiveDays);

  const result = await query(
    `UPDATE autopostvn_media 
     SET status = $1, archived_at = $2, updated_at = $2
     WHERE status = $3 AND created_at < $4
     RETURNING *`,
    [MediaStatus.ARCHIVED, new Date().toISOString(), MediaStatus.PUBLISHED, archiveDate.toISOString()]
  );

  return result.rows;
}

/**
 * Delete archived media based on policy
 */
export async function deleteArchivedMedia(policy: MediaLifecyclePolicy) {
  const deleteDate = new Date();
  deleteDate.setDate(deleteDate.getDate() - policy.autoDeleteDays);

  // Get media to delete from S3
  const mediaToDelete = await query(
    'SELECT storage_path FROM autopostvn_media WHERE status = $1 AND archived_at < $2',
    [MediaStatus.ARCHIVED, deleteDate.toISOString()]
  );

  // Delete from local storage
  for (const media of mediaToDelete.rows) {
    try {
      await localStorageService.deleteFile(media.storage_path);
    } catch (error) {
      console.error('Failed to delete from local storage:', error);
    }
  }

  // Delete from database
  const result = await query(
    'DELETE FROM autopostvn_media WHERE status = $1 AND archived_at < $2 RETURNING *',
    [MediaStatus.ARCHIVED, deleteDate.toISOString()]
  );

  return result.rows;
}

/**
 * Cleanup media by user role limits
 */
export async function cleanupMediaByUserRole(userRole: string) {
  const policy = LIFECYCLE_POLICIES[userRole];
  if (!policy) {
    throw new Error(`Unknown user role: ${userRole}`);
  }

  // Archive old media
  const archivedMedia = await archiveOldMedia(policy);
  
  // Delete old archived media
  const deletedMedia = await deleteArchivedMedia(policy);

  return {
    archived: archivedMedia.length,
    deleted: deletedMedia.length,
    policy
  };
}

/**
 * Get media statistics for a user
 */
export async function getMediaStats(userId: string, workspaceId?: string) {
  let whereClause = 'user_id = $1';
  let params: any[] = [userId];

  if (workspaceId) {
    whereClause += ' AND workspace_id = $2';
    params.push(workspaceId);
  }

  const statsQuery = `
    SELECT 
      COUNT(*) as total_files,
      COUNT(*) FILTER (WHERE status = 'uploaded') as uploaded,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'published') as published,
      COUNT(*) FILTER (WHERE status = 'archived') as archived,
      COUNT(*) FILTER (WHERE status = 'deleted') as deleted,
      COALESCE(SUM(file_size), 0) as total_size_bytes,
      COUNT(*) FILTER (WHERE media_type = 'image') as images,
      COUNT(*) FILTER (WHERE media_type = 'video') as videos
    FROM autopostvn_media
    WHERE ${whereClause}
  `;

  const result = await query(statsQuery, params);
  const stats = result.rows[0];

  return {
    totalFiles: parseInt(stats.total_files),
    byStatus: {
      uploaded: parseInt(stats.uploaded),
      processing: parseInt(stats.processing),
      published: parseInt(stats.published),
      archived: parseInt(stats.archived),
      deleted: parseInt(stats.deleted)
    },
    totalSizeBytes: parseInt(stats.total_size_bytes),
    totalSizeGB: parseFloat((parseInt(stats.total_size_bytes) / (1024 * 1024 * 1024)).toFixed(2)),
    byType: {
      images: parseInt(stats.images),
      videos: parseInt(stats.videos)
    }
  };
}