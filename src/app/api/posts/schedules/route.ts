import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, published, failed, etc.
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = sbServer()
    
    // Get user's workspace
    const userSlug = `user-${(session.user as any).id.replace(/-/g, '').substring(0, 8)}`
    const { data: workspace } = await supabase
      .from('autopostvn_workspaces')
      .select('id')
      .eq('slug', userSlug)
      .single()

    if (!workspace) {
      return NextResponse.json({ schedules: [] })
    }

    // Build query
    let query = supabase
      .from('autopostvn_post_schedules')
      .select(`
        id,
        post_id,
        scheduled_at,
        status,
        retry_count,
        error_message,
        external_post_id,
        published_at,
        created_at,
        social_account:autopostvn_social_accounts(
          id,
          name,
          provider
        ),
        post:autopostvn_posts(
          id,
          title,
          content,
          media_urls
        )
      `)
      .eq('post.workspace_id', workspace.id)
      .order('scheduled_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    // Filter out schedules without valid post or social account
    const validSchedules = schedules?.filter(schedule => 
      schedule.post && schedule.social_account
    ) || []

    return NextResponse.json({ 
      schedules: validSchedules,
      total: validSchedules.length 
    })

  } catch (error) {
    console.error('Schedules GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
