import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'
import { checkPostRateLimit, logPostUsage } from '@/lib/services/postUsageService'
import { userManagementService } from '@/lib/services/UserManagementService'

// GET /api/posts - Fetch user's posts
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = sbServer()
    
    // Fetch posts with their schedules and social accounts to get providers
    const { data: posts, error } = await supabase
      .from('autopostvn_posts')
      .select(`
        *,
        autopostvn_post_schedules (
          id,
          status,
          scheduled_at,
          published_at,
          social_account_id,
          autopostvn_social_accounts (
            provider
          )
        )
      `)
      .eq('user_id', (session.user as any).id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Transform posts to include providers array and aggregate status
    const transformedPosts = (posts || []).map((post: any) => {
      const schedules = post.autopostvn_post_schedules || [];
      
      // Get unique platforms from social accounts
      const uniqueProviders = [...new Set(schedules.map((s: any) => {
        const provider = s.autopostvn_social_accounts?.provider || '';
        // Map platform names to match UI expectations
        if (provider === 'facebook_page') return 'facebook';
        if (provider === 'instagram_business') return 'instagram';
        if (provider === 'facebook') return 'facebook';
        return provider;
      }).filter(Boolean))];  // Remove empty strings
      
      // Get all providers (with duplicates for counting schedules)
      const allProviders = schedules.map((s: any) => {
        const provider = s.autopostvn_social_accounts?.provider || '';
        if (provider === 'facebook_page') return 'facebook';
        if (provider === 'instagram_business') return 'instagram';
        if (provider === 'facebook') return 'facebook';
        return provider;
      }).filter(Boolean);
      
      // Return both unique providers (for display) and schedule counts
      const providers = allProviders; // Keep all for Analytics calculation
      const schedules_count = schedules.length;
      
      // Determine overall status
      let status = 'draft';
      if (schedules.length > 0) {
        const allPublished = schedules.every((s: any) => s.status === 'published');
        const anyFailed = schedules.some((s: any) => s.status === 'failed');
        const anyScheduled = schedules.some((s: any) => s.status === 'scheduled');
        
        if (allPublished) status = 'published';
        else if (anyFailed) status = 'failed';
        else if (anyScheduled) status = 'scheduled';
      }
      
      // Use the earliest scheduled_at or published_at
      const scheduledAt = schedules.length > 0 
        ? schedules.reduce((earliest: any, s: any) => {
            const date = s.published_at || s.scheduled_at;
            return !earliest || (date && new Date(date) < new Date(earliest)) ? date : earliest;
          }, null)
        : null;

      return {
        ...post,
        providers,
        schedules_count,
        status,
        scheduled_at: scheduledAt || post.created_at,
        // Remove the nested schedules from response
        autopostvn_post_schedules: undefined
      };
    });

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error('Posts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get user's role from session (already loaded from auth.users)
    const userRole = (session.user as any).user_role || 'free';
    console.log(`User ${userId} has role: ${userRole}`);

    // Check post rate limit before processing
    const rateLimitCheck = await checkPostRateLimit(userId, userRole);
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user ${userId}:`, rateLimitCheck);
      return NextResponse.json(
        { 
          error: 'Post limit exceeded',
          message: rateLimitCheck.message,
          stats: rateLimitCheck.stats
        },
        { status: 429 }
      );
    }

    const body = await request.json()
    const { title, content, providers, scheduled_at, media_urls } = body
    
    console.log('📝 [POST] Request body:', {
      title,
      content: content?.substring(0, 50) + '...',
      providers,
      scheduled_at,
      media_urls_count: media_urls?.length || 0
    });

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (providers && !Array.isArray(providers)) {
      return NextResponse.json(
        { error: 'Providers must be an array' },
        { status: 400 }
      )
    }

    const validProviders = ['facebook', 'facebook_page', 'instagram', 'zalo']
    if (providers?.some((p: string) => !validProviders.includes(p))) {
      return NextResponse.json(
        { error: 'Invalid provider. Allowed: ' + validProviders.join(', ') },
        { status: 400 }
      )
    }

    if (scheduled_at && new Date(scheduled_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Validate media URLs if provided
    if (media_urls && !Array.isArray(media_urls)) {
      return NextResponse.json(
        { error: 'Media URLs must be an array' },
        { status: 400 }
      )
    }

    if (media_urls && media_urls.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 images allowed' },
        { status: 400 }
      )
    }

    const supabase = sbServer()
    // Normalize scheduled time to UTC ISO string to avoid timezone drift
    const normalizedScheduledAt = scheduled_at ? new Date(scheduled_at).toISOString() : null;
    
    // Get workspace using UserManagementService (same as dashboard and /api/user/accounts)
    const workspace = await userManagementService.getOrCreateUserWorkspace(session.user.email!);
    console.log('🏢 [POST] Using workspace:', workspace.id, workspace.workspace_name);

    const { data: post, error } = await supabase
      .from('autopostvn_posts')
      .insert({
        workspace_id: workspace.id,
        title,
        content,
        user_id: (session.user as any).id,
        providers: providers || [],
        scheduled_at: normalizedScheduledAt,
        media_urls: media_urls || [],
        status: scheduled_at ? 'scheduled' : 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Post creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // Tạo post schedules nếu là scheduled post
    if (normalizedScheduledAt && providers && providers.length > 0) {
      console.log(`🔄 [POST] Creating schedules for post ${post.id}, providers:`, providers);
      await createPostSchedules(post.id, workspace.id, providers, normalizedScheduledAt);
    } else {
      console.log(`⚠️ [POST] No schedules created - scheduled_at: ${normalizedScheduledAt}, providers:`, providers);
    }

    // Log post usage after successful creation
    try {
      const platform = providers?.[0] || 'facebook'; // Use first provider or default
      const postType = scheduled_at ? 'scheduled' : 'draft';
      const scheduledDate = scheduled_at ? new Date(scheduled_at) : undefined;
      
      await logPostUsage(
        userId,
        postType as any,
        platform as any,
        post.id,
        scheduledDate,
        post.status as any
      );
    } catch (logError) {
      console.warn('Failed to log post usage:', logError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json(
      { 
        post, 
        message: 'Post created successfully',
        usage: rateLimitCheck.stats
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Posts POST error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/posts - Update existing post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, providers, scheduled_at, media_urls } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (providers) updateData.providers = providers
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at
    if (media_urls !== undefined) updateData.media_urls = media_urls

    // Validation
    if (updateData.content && updateData.content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (updateData.scheduled_at && new Date(updateData.scheduled_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    if (updateData.media_urls && !Array.isArray(updateData.media_urls)) {
      return NextResponse.json(
        { error: 'Media URLs must be an array' },
        { status: 400 }
      )
    }

    if (updateData.media_urls && updateData.media_urls.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 images allowed' },
        { status: 400 }
      )
    }

    const supabase = sbServer()
    const { data: post, error } = await supabase
      .from('autopostvn_posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', (session.user as any).id) // Ensure user owns the post
      .select()
      .single()

    if (error) {
      console.error('Post update error:', error)
      if (error.message.includes('Row not found')) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      post,
      message: 'Post updated successfully',
    })
  } catch (error) {
    console.error('Posts PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts - Delete post
export async function DELETE(request: NextRequest) {
  try {

    
    const session = await getServerSession(authOptions)

    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')


    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const supabase = sbServer()
    const { error } = await supabase
      .from('autopostvn_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', (session.user as any).id) // Ensure user owns the post



    if (error) {
      console.error('Post deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }


    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Posts DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Tạo post schedules cho bài đăng được lên lịch
 */
async function createPostSchedules(
  postId: string, 
  workspaceId: string, 
  providers: string[], 
  scheduledAt: string
) {
  try {
    console.log(`🔍 [SCHEDULES] Input - postId: ${postId}, workspaceId: ${workspaceId}, providers:`, providers, 'scheduledAt:', scheduledAt);
    
    const supabase = sbServer();
    
    // Lấy social accounts theo providers
    const { data: socialAccounts, error: accountsError } = await supabase
      .from('autopostvn_social_accounts')
      .select('id, provider')
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected')
      .in('provider', providers);

    console.log(`🔍 [SCHEDULES] Query result - accounts:`, socialAccounts, 'error:', accountsError);

    if (accountsError) {
      console.error('❌ Error fetching social accounts:', accountsError);
      return;
    }

    if (!socialAccounts || socialAccounts.length === 0) {
      console.warn('⚠️ No connected social accounts found for providers:', providers);
      return;
    }

    // Tạo schedule cho mỗi social account
    const schedules = socialAccounts.map(account => ({
      post_id: postId,
      social_account_id: account.id,
      scheduled_at: scheduledAt,
      status: 'pending',
      retry_count: 0
    }));

    console.log(`🔍 [SCHEDULES] Creating schedules:`, schedules);

    const { error: schedulesError } = await supabase
      .from('autopostvn_post_schedules')
      .insert(schedules);

    if (schedulesError) {
      console.error('❌ Error creating post schedules:', schedulesError);
    } else {
      console.log(`✅ Created ${schedules.length} post schedules for post ${postId}`);
    }

  } catch (error) {
    console.error('❌ Error in createPostSchedules:', error);
  }
}