import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { WorkspaceSettingsService } from '@/lib/services/workspace-settings.service';

interface WorkspaceToCleanup {
  id: string;
  name: string;
  settings: {
    advanced?: {
      autoDeleteOldPosts?: boolean;
      autoDeleteDays?: number;
    };
  };
}

interface DeletedPost {
  id: string;
  title: string;
  published_at: string;
}

/**
 * GET /api/cron/cleanup-old-posts - Auto delete old published posts
 * Should be triggered by Vercel Cron or external scheduler
 * 
 * Runs daily to check each workspace's settings and delete posts older than X days
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 [CLEANUP] Starting old posts cleanup...');

    // Get all workspaces with autoDeleteOldPosts enabled
    const workspacesResult = await query<WorkspaceToCleanup>(`
      SELECT id, name, settings
      FROM autopostvn_workspaces
      WHERE settings->'advanced'->>'autoDeleteOldPosts' = 'true'
    `);

    const workspaces = workspacesResult.rows;
    
    if (workspaces.length === 0) {
      console.log('ℹ️ [CLEANUP] No workspaces have auto-delete enabled');
      return NextResponse.json({
        success: true,
        message: 'No workspaces with auto-delete enabled',
        timestamp: new Date().toISOString(),
        workspacesProcessed: 0,
        totalDeleted: 0,
      });
    }

    console.log(`📋 [CLEANUP] Found ${workspaces.length} workspaces with auto-delete enabled`);

    let totalDeleted = 0;
    const results: Array<{
      workspaceId: string;
      workspaceName: string;
      daysThreshold: number;
      deleted: number;
      deletedPosts: DeletedPost[];
    }> = [];

    for (const workspace of workspaces) {
      const settings = await WorkspaceSettingsService.getSettings(workspace.id);
      const daysThreshold = settings.advanced.autoDeleteDays || 30;
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      console.log(`🔍 [CLEANUP] Processing workspace "${workspace.name}" - deleting posts older than ${daysThreshold} days (before ${cutoffDate.toISOString()})`);

      // First, get the posts that will be deleted (for logging)
      const postsToDelete = await query<DeletedPost>(`
        SELECT p.id, p.title, ps.published_at
        FROM autopostvn_posts p
        JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
        WHERE p.workspace_id = $1
          AND ps.status = 'published'
          AND ps.published_at < $2
      `, [workspace.id, cutoffDate.toISOString()]);

      if (postsToDelete.rows.length === 0) {
        console.log(`ℹ️ [CLEANUP] No old posts to delete for workspace "${workspace.name}"`);
        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          daysThreshold,
          deleted: 0,
          deletedPosts: [],
        });
        continue;
      }

      // Delete schedules first (foreign key constraint)
      await query(`
        DELETE FROM autopostvn_post_schedules
        WHERE post_id IN (
          SELECT p.id
          FROM autopostvn_posts p
          JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
          WHERE p.workspace_id = $1
            AND ps.status = 'published'
            AND ps.published_at < $2
        )
      `, [workspace.id, cutoffDate.toISOString()]);

      // Delete the posts
      const deleteResult = await query(`
        DELETE FROM autopostvn_posts
        WHERE id IN (
          SELECT DISTINCT post_id 
          FROM autopostvn_post_schedules ps
          JOIN autopostvn_posts p ON p.id = ps.post_id
          WHERE p.workspace_id = $1
            AND ps.published_at < $2
        )
        RETURNING id
      `, [workspace.id, cutoffDate.toISOString()]);

      const deletedCount = postsToDelete.rows.length;
      totalDeleted += deletedCount;

      console.log(`✅ [CLEANUP] Deleted ${deletedCount} old posts for workspace "${workspace.name}"`);

      results.push({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        daysThreshold,
        deleted: deletedCount,
        deletedPosts: postsToDelete.rows.map(p => ({
          id: p.id,
          title: p.title?.substring(0, 50) || 'Untitled',
          published_at: p.published_at,
        })),
      });
    }

    const duration = Date.now() - startTime;

    console.log(`🎉 [CLEANUP] Completed in ${duration}ms - Total deleted: ${totalDeleted} posts from ${workspaces.length} workspaces`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      workspacesProcessed: workspaces.length,
      totalDeleted,
      results,
    });
  } catch (error) {
    console.error('❌ [CLEANUP] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/cleanup-old-posts - Manual trigger (for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
