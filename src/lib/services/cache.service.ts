import { WorkspaceSettingsService, WorkspaceSettings } from './workspace-settings.service';

interface CacheEntry<T> {
  data: T;
  expires: number;
}

/**
 * Simple in-memory cache service cho workspace settings và rate limits
 * ✅ OPTIMIZATION: Cache settings để tránh repeated database queries
 */
export class CacheService {
  private static workspaceSettingsCache = new Map<string, CacheEntry<WorkspaceSettings>>();
  private static readonly SETTINGS_TTL = parseInt(process.env.SCHEDULER_CACHE_TTL || '300') * 1000; // 5 phút default
  
  /**
   * Get workspace settings với caching
   */
  static async getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
    const cached = this.workspaceSettingsCache.get(workspaceId);
    const now = Date.now();
    
    // Return cached nếu còn hạn
    if (cached && cached.expires > now) {
      console.log(`💾 [CACHE] Hit for workspace settings: ${workspaceId}`);
      return cached.data;
    }
    
    // Fetch fresh data
    console.log(`🔄 [CACHE] Miss for workspace settings: ${workspaceId}`);
    const settings = await WorkspaceSettingsService.getSettings(workspaceId);
    
    // Cache it
    this.workspaceSettingsCache.set(workspaceId, {
      data: settings,
      expires: now + this.SETTINGS_TTL
    });
    
    return settings;
  }
  
  /**
   * Pre-load settings cho multiple workspaces (batch optimization)
   */
  static async preloadWorkspaceSettings(workspaceIds: string[]): Promise<void> {
    const now = Date.now();
    const idsToFetch: string[] = [];
    
    // Check cache first
    for (const id of workspaceIds) {
      const cached = this.workspaceSettingsCache.get(id);
      if (!cached || cached.expires <= now) {
        idsToFetch.push(id);
      }
    }
    
    if (idsToFetch.length === 0) {
      console.log(`💾 [CACHE] All ${workspaceIds.length} workspace settings already cached`);
      return;
    }
    
    console.log(`🔄 [CACHE] Pre-loading ${idsToFetch.length}/${workspaceIds.length} workspace settings`);
    
    // Fetch in parallel
    const settingsPromises = idsToFetch.map(id => 
      WorkspaceSettingsService.getSettings(id)
        .then(settings => ({ id, settings }))
        .catch(err => {
          console.error(`Failed to load settings for ${id}:`, err);
          return null;
        })
    );
    
    const results = await Promise.all(settingsPromises);
    
    // Cache all results
    results.forEach(result => {
      if (result) {
        this.workspaceSettingsCache.set(result.id, {
          data: result.settings,
          expires: now + this.SETTINGS_TTL
        });
      }
    });
    
    console.log(`✅ [CACHE] Pre-loaded ${results.filter(r => r !== null).length} workspace settings`);
  }
  
  /**
   * Invalidate cache cho một workspace
   */
  static invalidateWorkspace(workspaceId: string): void {
    this.workspaceSettingsCache.delete(workspaceId);
    console.log(`🗑️ [CACHE] Invalidated cache for workspace: ${workspaceId}`);
  }
  
  /**
   * Invalidate all cache
   */
  static invalidateAll(): void {
    this.workspaceSettingsCache.clear();
    console.log(`🗑️ [CACHE] Invalidated all cache`);
  }
  
  /**
   * Cleanup expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.workspaceSettingsCache.entries()) {
      if (entry.expires <= now) {
        this.workspaceSettingsCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [CACHE] Cleaned up ${cleaned} expired entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  static getStats(): {
    workspaceSettings: {
      size: number;
      entries: Array<{ workspaceId: string; expiresIn: number }>;
    };
  } {
    const now = Date.now();
    const entries: Array<{ workspaceId: string; expiresIn: number }> = [];
    
    for (const [workspaceId, entry] of this.workspaceSettingsCache.entries()) {
      entries.push({
        workspaceId,
        expiresIn: Math.max(0, entry.expires - now)
      });
    }
    
    return {
      workspaceSettings: {
        size: this.workspaceSettingsCache.size,
        entries
      }
    };
  }
}
