import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { runScheduler } from '@/lib/scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 5

    console.log(`🚀 [MANUAL TEST] User ${session.user.email} triggered scheduler with limit: ${limit}`)

    const result = await runScheduler(limit)

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      timestamp: new Date().toISOString(),
      triggered_by: session.user.email,
      ...result
    })

  } catch (error: any) {
    console.error('❌ [MANUAL TEST] Scheduler test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    console.log(`🔍 [SCHEDULER STATUS] User ${session.user.email} checking scheduler status`)

    const result = await runScheduler(limit)

    return NextResponse.json({
      success: true,
      message: 'Scheduler status check completed',
      timestamp: new Date().toISOString(),
      checked_by: session.user.email,
      ...result
    })

  } catch (error: any) {
    console.error('❌ [SCHEDULER STATUS] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
