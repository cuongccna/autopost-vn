import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';
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
    
    const supabase = sbServer();
    
    // If no workspace_id provided, get user's default workspace
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      console.log('⚠️ No workspaceId provided, finding default workspace for user:', userId);
      
      // Try multiple strategies to find workspace
      // Strategy 1: Find by user slug
      const userSlug = `user-${userId.replace(/-/g, '').substring(0, 8)}`;
      console.log('🔍 Searching for workspace with slug:', userSlug);
      
      let { data: workspace, error: slugError } = await supabase
        .from('autopostvn_workspaces')
        .select('id, slug')
        .eq('slug', userSlug)
        .single();
      
      if (slugError || !workspace) {
        console.log('⚠️ Workspace not found by slug, trying to find any workspace...');
        
        // Strategy 2: Get the first workspace (fallback)
        const { data: workspaces, error: listError } = await supabase
          .from('autopostvn_workspaces')
          .select('id, slug')
          .limit(1);
        
        if (listError || !workspaces || workspaces.length === 0) {
          console.error('❌ No workspaces found in database');
          return NextResponse.json(
            { error: 'Workspace not found. Please create a workspace first.' },
            { status: 404 }
          );
        }
        
        workspace = workspaces[0];
        console.log('✅ Using first available workspace:', workspace);
      } else {
        console.log('✅ Found workspace by slug:', workspace);
      }
      
      targetWorkspaceId = workspace.id;
    }
    
    console.log('🎯 Target workspace ID:', targetWorkspaceId);
    
    // Get workspace settings
    const { data: workspace, error } = await supabase
      .from('autopostvn_workspaces')
      .select('id, name, slug, settings')
      .eq('id', targetWorkspaceId)
      .single();
    
    if (error) {
      logger.error('Failed to fetch workspace settings', { error, workspaceId: targetWorkspaceId });
      return NextResponse.json(
        { error: 'Failed to fetch workspace settings' },
        { status: 500 }
      );
    }
    
    if (!workspace) {
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
    
    const supabase = sbServer();
    
    // If no workspace_id provided, get user's default workspace
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      console.log('⚠️ No workspaceId provided, finding default workspace for user:', userId);
      
      // Try multiple strategies to find workspace
      // Strategy 1: Find by user slug
      const userSlug = `user-${userId.replace(/-/g, '').substring(0, 8)}`;
      console.log('🔍 Searching for workspace with slug:', userSlug);
      
      let { data: workspace, error: slugError } = await supabase
        .from('autopostvn_workspaces')
        .select('id, slug')
        .eq('slug', userSlug)
        .single();
      
      if (slugError || !workspace) {
        console.log('⚠️ Workspace not found by slug, trying to find any workspace...');
        
        // Strategy 2: Get the first workspace (fallback)
        const { data: workspaces, error: listError } = await supabase
          .from('autopostvn_workspaces')
          .select('id, slug')
          .limit(1);
        
        if (listError || !workspaces || workspaces.length === 0) {
          console.error('❌ No workspaces found in database');
          return NextResponse.json(
            { error: 'Workspace not found. Please create a workspace first.' },
            { status: 404 }
          );
        }
        
        workspace = workspaces[0];
        console.log('✅ Using first available workspace:', workspace);
      } else {
        console.log('✅ Found workspace by slug:', workspace);
      }
      
      targetWorkspaceId = workspace.id;
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
    const { data: updatedWorkspace, error } = await supabase
      .from('autopostvn_workspaces')
      .update({ 
        settings: validatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetWorkspaceId)
      .select('id, name, slug, settings')
      .single();
    
    if (error) {
      logger.error('Failed to update workspace settings', { error, workspaceId: targetWorkspaceId });
      return NextResponse.json(
        { error: 'Failed to update workspace settings' },
        { status: 500 }
      );
    }
    
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
      settings: updatedWorkspace.settings,
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
