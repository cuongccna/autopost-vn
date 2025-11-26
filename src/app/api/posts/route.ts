import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

// GET /api/posts - Fetch user's posts
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Fetch posts with their schedules and social accounts using PostgreSQL
    const result = await query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ps.id,
              'status', ps.status,
              'scheduled_at', ps.scheduled_at,
              'published_at', ps.published_at,
              'social_account_id', ps.social_account_id,
              'provider', sa.provider,
              'platform_name', sa.platform_name
            )
          ) FILTER (WHERE ps.id IS NOT NULL),
          '[]'
        ) as schedules
      FROM autopostvn_posts p
      LEFT JOIN autopostvn_post_schedules ps ON ps.post_id = p.id
      LEFT JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);

    const posts = result.rows;

    // Transform posts to include providers array and aggregate status
    const transformedPosts = (posts || []).map((post: any) => {
      const schedules = post.schedules || [];
      
      // Get unique platforms
      const providers = [...new Set(
        schedules
          .filter((s: any) => s.provider)
          .map((s: any) => s.provider)
      )];

      // Determine overall status based on schedules
      let status = 'draft';
      if (schedules.length > 0) {
        const statuses = schedules.map((s: any) => s.status);
        if (statuses.every((s: string) => s === 'published')) {
          status = 'published';
        } else if (statuses.some((s: string) => s === 'scheduled')) {
          status = 'scheduled';
        } else if (statuses.some((s: string) => s === 'failed')) {
          status = 'failed';
        }
      }

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        media: post.media_urls || [],
        media_urls: post.media_urls || [],
        providers,
        status,
        scheduled_at: post.scheduled_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        schedules
      };
    });

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { content, media_urls, schedules, title, workspace_id, providers, scheduled_at, metadata, media_type } = body;

    console.log('[POST /api/posts] Request body:', JSON.stringify(body, null, 2));

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get user's workspace if not provided
    let workspaceId = workspace_id;
    if (!workspaceId) {
      const workspaceResult = await query(
        `SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      
      if (!workspaceResult.rows[0]) {
        console.error('[POST /api/posts] No workspace found for user:', userId);
        return NextResponse.json({ error: 'No workspace found. Please create a workspace first.' }, { status: 400 });
      }
      
      workspaceId = workspaceResult.rows[0].id;
    }

    console.log('[POST /api/posts] Using workspace_id:', workspaceId);

    // Validate that workspace exists and belongs to user
    const workspaceCheck = await query(
      `SELECT id FROM autopostvn_workspaces WHERE id = $1 AND user_id = $2`,
      [workspaceId, userId]
    );

    if (!workspaceCheck.rows[0]) {
      console.error('[POST /api/posts] Workspace validation failed:', { workspaceId, userId });
      return NextResponse.json({ error: 'Invalid workspace or access denied' }, { status: 403 });
    }

    // Insert post with all required fields
    const postResult = await query(
      `INSERT INTO autopostvn_posts (workspace_id, user_id, title, content, media_urls, providers, status, scheduled_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        workspaceId,
        userId,
        title || content.substring(0, 50), // Use first 50 chars of content as title if not provided
        content,
        media_urls || [],
        providers || [],
        scheduled_at ? 'scheduled' : 'draft', // Set status based on scheduled_at
        scheduled_at || null,
        metadata || {}
      ]
    );

    const post = postResult.rows[0];
    console.log('[POST /api/posts] Post created:', post.id);

    // Create schedules if provided (supports both old and new format)
    if (schedules && schedules.length > 0) {
      console.log('[POST /api/posts] Creating schedules (old format):', schedules.length);
      
      // Old format: array of schedule objects with social_account_id
      for (const schedule of schedules) {
        if (!schedule.social_account_id) {
          console.warn('[POST /api/posts] Skipping schedule without social_account_id');
          continue;
        }
        
        if (!schedule.scheduled_at) {
          console.warn('[POST /api/posts] Skipping schedule without scheduled_at');
          continue;
        }

        await query(
          `INSERT INTO autopostvn_post_schedules 
           (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [
            post.id,
            schedule.social_account_id,
            schedule.scheduled_at,
            'pending'  // Status must be 'pending' for scheduled posts
          ]
        );
      }
    } else if (providers && providers.length > 0 && scheduled_at) {
      console.log('[POST /api/posts] Creating schedules (new format):', providers);
      
      // New format: providers array with scheduled_at timestamp
      // Get social accounts for these providers
      const accountsResult = await query(
        `SELECT id, provider, platform_name FROM autopostvn_social_accounts 
         WHERE workspace_id = $1 AND provider = ANY($2)`,
        [workspaceId, providers]
      );
      
      const accounts = accountsResult.rows;
      console.log('[POST /api/posts] Found social accounts:', accounts.length);

      if (accounts.length === 0) {
        console.warn('[POST /api/posts] No social accounts found for providers:', providers);
        return NextResponse.json({ 
          error: `No social accounts found for platforms: ${providers.join(', ')}. Please connect your accounts first.` 
        }, { status: 400 });
      }

      for (const account of accounts) {
        await query(
          `INSERT INTO autopostvn_post_schedules 
           (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [
            post.id,
            account.id,
            scheduled_at,
            'pending'  // Status must be 'pending' for scheduled posts
          ]
        );
        console.log('[POST /api/posts] Created schedule for account:', account.id, account.platform_name);
      }
    } else if (providers && providers.length > 0 && !scheduled_at) {
      console.log('[POST /api/posts] Providers specified but no scheduled_at - creating draft');
    }

    // Log activity
    await query(
      `INSERT INTO autopostvn_system_activity_logs 
       (user_id, workspace_id, action_type, action_category, description, target_resource_type, target_resource_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId, workspaceId, 'post_created', 'post', `Created post: ${post.id}`, 'post', post.id]
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts - Update existing post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { id, content, media_urls, title, providers, scheduled_at, metadata, media_type } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id, workspace_id FROM autopostvn_posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    const workspaceId = ownerCheck.rows[0].workspace_id;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    
    if (media_urls !== undefined) {
      updates.push(`media_urls = $${paramIndex++}`);
      values.push(media_urls || []);
    }

    if (providers !== undefined) {
      updates.push(`providers = $${paramIndex++}`);
      values.push(providers || []);
    }

    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(metadata || {});
    }

    if (media_type !== undefined) {
      updates.push(`media_type = $${paramIndex++}`);
      values.push(media_type);
    }

    if (scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`);
      values.push(scheduled_at);
    }

    updates.push(`updated_at = NOW()`);
    
    // Add WHERE clause parameters
    values.push(id, userId);

    // Update post
    const result = await query(
      `UPDATE autopostvn_posts 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    const post = result.rows[0];

    // Update schedules if providers changed
    if (providers !== undefined && providers.length > 0) {
      // Delete existing schedules
      await query(
        'DELETE FROM autopostvn_post_schedules WHERE post_id = $1',
        [id]
      );

      // Get social accounts for these providers
      const accountsResult = await query(
        `SELECT id, provider FROM autopostvn_social_accounts 
         WHERE workspace_id = $1 AND provider = ANY($2)`,
        [workspaceId, providers]
      );
      
      const accounts = accountsResult.rows;
      for (const account of accounts) {
        await query(
          `INSERT INTO autopostvn_post_schedules 
           (post_id, social_account_id, scheduled_at, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [
            id,
            account.id,
            scheduled_at || null,
            scheduled_at ? 'scheduled' : 'pending'
          ]
        );
      }
    }

    // Log activity
    await query(
      `INSERT INTO autopostvn_system_activity_logs 
       (user_id, workspace_id, action_type, action_category, description, target_resource_type, target_resource_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId, workspaceId, 'post_updated', 'post', `Updated post: ${id}`, 'post', id]
    );

    return NextResponse.json(post);
  } catch (error) {
    console.error('Posts PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts - Delete post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Verify ownership and get workspace_id
    const ownerCheck = await query(
      'SELECT id, workspace_id FROM autopostvn_posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
    }

    const workspaceId = ownerCheck.rows[0].workspace_id;

    // Delete schedules first (foreign key constraint)
    await query(
      'DELETE FROM autopostvn_post_schedules WHERE post_id = $1',
      [id]
    );

    // Delete post
    await query(
      'DELETE FROM autopostvn_posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Log activity
    await query(
      `INSERT INTO autopostvn_system_activity_logs 
       (user_id, workspace_id, action_type, action_category, description, target_resource_type, target_resource_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId, workspaceId, 'post_deleted', 'post', `Deleted post: ${id}`, 'post', id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Posts DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
