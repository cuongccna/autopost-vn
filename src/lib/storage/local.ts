/**
 * Local File Storage System
 * Replaces Supabase Storage for file uploads
 * Designed for VPS deployment with local filesystem
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { existsSync } from 'fs';

// Storage configuration
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || './public/uploads';
const PUBLIC_URL_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Supported file buckets (equivalent to Supabase buckets)
 */
export type StorageBucket = 'post-images' | 'post-videos' | 'avatars' | 'documents';

/**
 * File upload result
 */
export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
  size?: number;
  mimeType?: string;
}

/**
 * Ensure directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Get file MIME type from extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Validate file size
 */
function validateFileSize(size: number, bucket: StorageBucket): boolean {
  const maxSizes: Record<StorageBucket, number> = {
    'post-images': 10 * 1024 * 1024, // 10 MB
    'post-videos': 100 * 1024 * 1024, // 100 MB
    'avatars': 5 * 1024 * 1024, // 5 MB
    'documents': 20 * 1024 * 1024, // 20 MB
  };
  return size <= maxSizes[bucket];
}

/**
 * Validate file type
 */
function validateFileType(filename: string, bucket: StorageBucket): boolean {
  const ext = path.extname(filename).toLowerCase();
  const allowedTypes: Record<StorageBucket, string[]> = {
    'post-images': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'post-videos': ['.mp4', '.mov', '.avi', '.mkv'],
    'avatars': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'documents': ['.pdf', '.doc', '.docx', '.txt'],
  };
  return allowedTypes[bucket].includes(ext);
}

/**
 * Upload file to local storage
 */
export async function uploadFile(
  bucket: StorageBucket,
  originalFilename: string,
  fileBuffer: Buffer,
  options?: {
    customPath?: string;
    overwrite?: boolean;
  }
): Promise<UploadResult> {
  try {
    // Validate file size
    if (!validateFileSize(fileBuffer.length, bucket)) {
      return {
        success: false,
        error: 'File size exceeds limit'
      };
    }

    // Validate file type
    if (!validateFileType(originalFilename, bucket)) {
      return {
        success: false,
        error: 'Invalid file type'
      };
    }

    // Generate filename
    const filename = options?.customPath || generateFilename(originalFilename);
    const bucketDir = path.join(UPLOAD_BASE_DIR, bucket);
    await ensureDirectory(bucketDir);

    // Full file path
    const filePath = path.join(bucketDir, filename);

    // Check if file exists and overwrite is false
    if (existsSync(filePath) && !options?.overwrite) {
      return {
        success: false,
        error: 'File already exists'
      };
    }

    // Write file
    await fs.writeFile(filePath, fileBuffer as any);

    // Generate public URL
    const publicUrl = `${PUBLIC_URL_BASE}/uploads/${bucket}/${filename}`;

    return {
      success: true,
      publicUrl,
      path: `${bucket}/${filename}`,
      size: fileBuffer.length,
      mimeType: getMimeType(originalFilename)
    };
  } catch (error) {
    console.error('❌ File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete file from local storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(UPLOAD_BASE_DIR, bucket, filename);

    if (!existsSync(filePath)) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    await fs.unlink(filePath);

    return { success: true };
  } catch (error) {
    console.error('❌ File delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Get file URL
 */
export function getFileUrl(bucket: StorageBucket, filename: string): string {
  return `${PUBLIC_URL_BASE}/uploads/${bucket}/${filename}`;
}

/**
 * List files in bucket
 */
export async function listFiles(
  bucket: StorageBucket,
  options?: {
    limit?: number;
    offset?: number;
    prefix?: string;
  }
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const bucketDir = path.join(UPLOAD_BASE_DIR, bucket);
    
    if (!existsSync(bucketDir)) {
      return { success: true, files: [] };
    }

    let files = await fs.readdir(bucketDir);

    // Filter by prefix
    if (options?.prefix) {
      files = files.filter(f => f.startsWith(options.prefix!));
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || files.length;
    files = files.slice(offset, offset + limit);

    return {
      success: true,
      files
    };
  } catch (error) {
    console.error('❌ List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed'
    };
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  bucket: StorageBucket,
  filename: string
): Promise<{
  success: boolean;
  metadata?: {
    size: number;
    mimeType: string;
    created: Date;
    modified: Date;
  };
  error?: string;
}> {
  try {
    const filePath = path.join(UPLOAD_BASE_DIR, bucket, filename);

    if (!existsSync(filePath)) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    const stats = await fs.stat(filePath);

    return {
      success: true,
      metadata: {
        size: stats.size,
        mimeType: getMimeType(filename),
        created: stats.birthtime,
        modified: stats.mtime
      }
    };
  } catch (error) {
    console.error('❌ Get metadata error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metadata'
    };
  }
}

/**
 * Move/rename file
 */
export async function moveFile(
  bucket: StorageBucket,
  oldFilename: string,
  newFilename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldPath = path.join(UPLOAD_BASE_DIR, bucket, oldFilename);
    const newPath = path.join(UPLOAD_BASE_DIR, bucket, newFilename);

    if (!existsSync(oldPath)) {
      return {
        success: false,
        error: 'Source file not found'
      };
    }

    await fs.rename(oldPath, newPath);

    return { success: true };
  } catch (error) {
    console.error('❌ Move file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Move failed'
    };
  }
}

/**
 * Copy file
 */
export async function copyFile(
  bucket: StorageBucket,
  sourceFilename: string,
  destFilename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sourcePath = path.join(UPLOAD_BASE_DIR, bucket, sourceFilename);
    const destPath = path.join(UPLOAD_BASE_DIR, bucket, destFilename);

    if (!existsSync(sourcePath)) {
      return {
        success: false,
        error: 'Source file not found'
      };
    }

    await fs.copyFile(sourcePath, destPath);

    return { success: true };
  } catch (error) {
    console.error('❌ Copy file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Copy failed'
    };
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  success: boolean;
  stats?: Record<StorageBucket, { count: number; totalSize: number }>;
  error?: string;
}> {
  try {
    const buckets: StorageBucket[] = ['post-images', 'post-videos', 'avatars', 'documents'];
    const stats: Record<string, { count: number; totalSize: number }> = {};

    for (const bucket of buckets) {
      const bucketDir = path.join(UPLOAD_BASE_DIR, bucket);
      
      if (!existsSync(bucketDir)) {
        stats[bucket] = { count: 0, totalSize: 0 };
        continue;
      }

      const files = await fs.readdir(bucketDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(bucketDir, file);
        const stat = await fs.stat(filePath);
        totalSize += stat.size;
      }

      stats[bucket] = {
        count: files.length,
        totalSize
      };
    }

    return { success: true, stats: stats as any };
  } catch (error) {
    console.error('❌ Get storage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    };
  }
}

/**
 * Clean up old files (older than specified days)
 */
export async function cleanupOldFiles(
  bucket: StorageBucket,
  daysOld: number
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const bucketDir = path.join(UPLOAD_BASE_DIR, bucket);
    
    if (!existsSync(bucketDir)) {
      return { success: true, deletedCount: 0 };
    }

    const files = await fs.readdir(bucketDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(bucketDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    };
  }
}
