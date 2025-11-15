import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export class LocalStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    // Thư mục upload trong public để có thể serve static files
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Tạo thư mục upload nếu chưa tồn tại
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      // Tạo thư mục nếu không tồn tại
      await fs.mkdir(this.uploadDir, { recursive: true });
      
      // Tạo các thư mục con cho từng loại file
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'videos'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), { recursive: true });
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    contentType: string,
    options: {
      userId?: string;
      workspaceId?: string;
    } = {}
  ): Promise<UploadedFile> {
    console.log('📤 [LOCAL STORAGE] Upload started:', {
      originalName,
      contentType,
      fileSize: file.length,
      userId: options.userId,
      workspaceId: options.workspaceId
    });

    await this.ensureUploadDir();

    // Tạo tên file unique
    const fileExtension = path.extname(originalName);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Xác định thư mục con dựa trên content type
    let subDir = 'documents';
    if (contentType.startsWith('image/')) {
      subDir = 'images';
    } else if (contentType.startsWith('video/')) {
      subDir = 'videos';
    }

    console.log('📁 [LOCAL STORAGE] Determined subdirectory:', subDir);

    // Thêm userId vào path nếu có
    if (options.userId) {
      subDir = path.join(subDir, options.userId);
      await fs.mkdir(path.join(this.uploadDir, subDir), { recursive: true });
      console.log('📂 [LOCAL STORAGE] Created user subdirectory:', subDir);
    }

    const filePath = path.join(this.uploadDir, subDir, fileName);
    const relativePath = path.join('uploads', subDir, fileName).replace(/\\/g, '/');

    console.log('💾 [LOCAL STORAGE] Writing file to disk:', {
      filePath,
      relativePath,
      size: file.length
    });

    // Lưu file
    await fs.writeFile(filePath, file);

    console.log('✅ [LOCAL STORAGE] File written successfully');

    // Tạo URL public
    const url = `${this.baseUrl}/${relativePath}`;

    console.log('🔗 [LOCAL STORAGE] Generated public URL:', url);

    return {
      url,
      path: relativePath,
      size: file.length,
      contentType
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // filePath có thể là relative path từ database hoặc full path
      let fullPath: string;
      
      if (filePath.startsWith('uploads/')) {
        // Relative path từ public
        fullPath = path.join(process.cwd(), 'public', filePath);
      } else if (path.isAbsolute(filePath)) {
        // Absolute path
        fullPath = filePath;
      } else {
        // Assume it's relative to upload directory
        fullPath = path.join(this.uploadDir, filePath);
      }

      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Không throw error để không break workflow
    }
  }

  async getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
    try {
      let fullPath: string;
      
      if (filePath.startsWith('uploads/')) {
        fullPath = path.join(process.cwd(), 'public', filePath);
      } else if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        fullPath = path.join(this.uploadDir, filePath);
      }

      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        mtime: stats.mtime
      };
    } catch {
      return null;
    }
  }

  async listFiles(directory?: string): Promise<string[]> {
    try {
      const targetDir = directory 
        ? path.join(this.uploadDir, directory)
        : this.uploadDir;
      
      const files = await fs.readdir(targetDir, { recursive: true });
      return files.filter(file => typeof file === 'string') as string[];
    } catch {
      return [];
    }
  }

  // Cleanup old files (for cron jobs)
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    
    try {
      const files = await this.listFiles();
      
      for (const file of files) {
        const fullPath = path.join(this.uploadDir, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(fullPath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }

    return deletedCount;
  }

  // Get disk usage
  async getDiskUsage(): Promise<{ totalSize: number; fileCount: number }> {
    let totalSize = 0;
    let fileCount = 0;

    try {
      const files = await this.listFiles();
      
      for (const file of files) {
        const fullPath = path.join(this.uploadDir, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      console.error('Error calculating disk usage:', error);
    }

    return { totalSize, fileCount };
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
