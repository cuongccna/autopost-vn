import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, update as updateRecord } from '@/lib/db/postgres';
import logger from '@/lib/utils/logger';

// Default workspace settings
const DEFAULT_SETTINGS = {
  notifications: {
    onSuccess: true,
    onFailure: true,
    onTokenExpiry: true,
  },
  scheduling: {
    timezone: 'Asia/Ho_Chi_Minh',
    goldenHours: ['09:00', '12:30', '20:00'],
    rateLimit: 10,
  },
  advanced: {
    autoDeleteOldPosts: false,
    autoDeleteDays: 30,
    testMode: false,
  },
};

// GET /api/workspace/settings - Get workspace settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    
    console.log('📥 GET /api/workspace/settings', {
      userId,
      workspaceId,
    });
    
    // Get user's workspace
    let targetWorkspaceId = workspaceId;
    
    if (!targetWorkspaceId) {
      // Find workspace by user_id
      const wsResult = await query(
        'SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      
      if (wsResult.rows.length === 0) {
        logger.error('No workspace found for user', { userId });
        return NextResponse.json(
          { error: 'No workspace found. Please create a workspace first.' },
          { status: 404 }
        );
      }
      
      targetWorkspaceId = wsResult.rows[0].id;
    }
    
    console.log('🎯 Target workspace ID:', targetWorkspaceId);
    
    // Get workspace settings
    const result = await query(
      'SELECT id, name, slug, settings FROM autopostvn_workspaces WHERE id = $1 LIMIT 1',
      [targetWorkspaceId]
    );
    
    const workspace = result.rows[0];
    
    if (!workspace) {
      logger.error('Failed to fetch workspace settings', { workspaceId: targetWorkspaceId });
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Merge with defaults to ensure all fields exist
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(workspace.settings || {}),
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(workspace.settings?.notifications || {}),
      },
      scheduling: {
        ...DEFAULT_SETTINGS.scheduling,
        ...(workspace.settings?.scheduling || {}),
      },
      advanced: {
        ...DEFAULT_SETTINGS.advanced,
        ...(workspace.settings?.advanced || {}),
      },
    };
    
    return NextResponse.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      settings,
    });
    
  } catch (error) {
    logger.error('Workspace settings GET error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workspace/settings - Update workspace settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = (session.user as any).id;
    const body = await request.json();
    const { workspaceId, settings } = body;
    
    console.log('📝 PUT /api/workspace/settings', {
      userId,
      workspaceId,
      hasSettings: !!settings,
    });
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }
    
    // Get user's workspace
    let targetWorkspaceId = workspaceId;
    
    if (!targetWorkspaceId) {
      // Find workspace by user_id
      const wsResult = await query(
        'SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      
      if (wsResult.rows.length === 0) {
        logger.error('No workspace found for user', { userId });
        return NextResponse.json(
          { error: 'No workspace found. Please create a workspace first.' },
          { status: 404 }
        );
      }
      
      targetWorkspaceId = wsResult.rows[0].id;
    }
    
    console.log('🎯 Target workspace ID:', targetWorkspaceId);
    
    // Validate settings structure
    const validatedSettings = {
      notifications: {
        onSuccess: settings.notifications?.onSuccess ?? DEFAULT_SETTINGS.notifications.onSuccess,
        onFailure: settings.notifications?.onFailure ?? DEFAULT_SETTINGS.notifications.onFailure,
        onTokenExpiry: settings.notifications?.onTokenExpiry ?? DEFAULT_SETTINGS.notifications.onTokenExpiry,
      },
      scheduling: {
        timezone: settings.scheduling?.timezone || DEFAULT_SETTINGS.scheduling.timezone,
        goldenHours: Array.isArray(settings.scheduling?.goldenHours) 
          ? settings.scheduling.goldenHours.slice(0, 3) // Max 3 golden hours
          : DEFAULT_SETTINGS.scheduling.goldenHours,
        rateLimit: Math.max(1, Math.min(100, settings.scheduling?.rateLimit || DEFAULT_SETTINGS.scheduling.rateLimit)),
      },
      advanced: {
        autoDeleteOldPosts: settings.advanced?.autoDeleteOldPosts ?? DEFAULT_SETTINGS.advanced.autoDeleteOldPosts,
        autoDeleteDays: Math.max(1, settings.advanced?.autoDeleteDays || DEFAULT_SETTINGS.advanced.autoDeleteDays),
        testMode: settings.advanced?.testMode ?? DEFAULT_SETTINGS.advanced.testMode,
      },
    };
    
    // Update workspace settings
    const updated = await updateRecord(
      'autopostvn_workspaces',
      { settings: validatedSettings }, // Don't stringify - PostgreSQL JSONB handles this
      { id: targetWorkspaceId }
    );
    
    if (!updated || updated.length === 0) {
      logger.error('Failed to update workspace settings', { workspaceId: targetWorkspaceId });
      return NextResponse.json(
        { error: 'Failed to update workspace settings' },
        { status: 500 }
      );
    }
    
    const updatedWorkspace = updated[0];
    
    logger.info('Workspace settings updated', { 
      workspaceId: targetWorkspaceId,
      userId,
      settings: validatedSettings,
    });
    
    return NextResponse.json({
      success: true,
      workspaceId: updatedWorkspace.id,
      workspaceName: updatedWorkspace.name,
      workspaceSlug: updatedWorkspace.slug,
      settings: updatedWorkspace.settings || validatedSettings, // Use returned settings or fallback
      message: 'Workspace settings updated successfully',
    });
    
  } catch (error) {
    logger.error('Workspace settings PUT error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
