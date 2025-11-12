import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db/postgres'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, published, failed, etc.
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query with filters
    let sqlQuery = `
      SELECT 
        ps.id,
        ps.post_id,
        ps.scheduled_at,
        ps.status,
        ps.retry_count,
        ps.error_message,
        ps.external_post_id,
        ps.published_at,
        ps.created_at,
        json_build_object(
          'id', sa.id,
          'name', sa.platform_name,
          'provider', sa.provider
        ) as social_account,
        json_build_object(
          'id', p.id,
          'content', p.content,
          'media_urls', p.media_urls
        ) as post
      FROM autopostvn_post_schedules ps
      INNER JOIN autopostvn_posts p ON p.id = ps.post_id
      INNER JOIN autopostvn_social_accounts sa ON sa.id = ps.social_account_id
      WHERE p.user_id = $1
    `
    
    const params: any[] = [userId]
    let paramIndex = 2

    if (status) {
      sqlQuery += ` AND ps.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    sqlQuery += ` ORDER BY ps.scheduled_at DESC LIMIT $${paramIndex}`
    params.push(limit)

    const result = await query(sqlQuery, params)
    const schedules = result.rows

    return NextResponse.json({ 
      schedules: schedules,
      total: schedules.length 
    })

  } catch (error) {
    console.error('Schedules GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
