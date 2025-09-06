import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'
import { checkPostRateLimit, logPostUsage } from '@/lib/services/postUsageService'

// GET /api/posts - Fetch user's posts
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = sbServer()
    const { data: posts, error } = await supabase
      .from('autopostvn_posts')
      .select('*')
      .eq('user_id', (session.user as any).id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ posts })
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

    // Get user's actual role from database
    const supabaseAdmin = sbServer(true); // Use service role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const userRole = userData?.role || 'free';
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

    const validProviders = ['facebook', 'instagram', 'zalo']
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
    
    // Get or create default workspace for user
    const userSlug = `user-${(session.user as any).id.replace(/-/g, '').substring(0, 8)}`

    let { data: workspace, error: workspaceError } = await supabase
      .from('autopostvn_workspaces')
      .select('id')
      .eq('slug', userSlug)
      .single()

    if (workspaceError || !workspace) {
      // Create default workspace for user
      const { data: newWorkspace, error: createWorkspaceError } = await supabase
        .from('autopostvn_workspaces')
        .insert({
          name: 'Workspace của tôi',
          slug: userSlug,
          description: 'Workspace mặc định',
        })
        .select('id')
        .single()

      if (createWorkspaceError) {
        console.error('❌ Failed to create workspace:', createWorkspaceError)
        return NextResponse.json(
          { error: 'Failed to create workspace', details: createWorkspaceError },
          { status: 500 }
        )
      }
      workspace = newWorkspace
    }

    const { data: post, error } = await supabase
      .from('autopostvn_posts')
      .insert({
        workspace_id: workspace.id,
        title,
        content,
        user_id: (session.user as any).id,
        providers: providers || [],
        scheduled_at: scheduled_at || null,
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