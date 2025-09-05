import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { initializeStorage } from '@/lib/supabase/storage'

// Initialize storage bucket for images
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to initialize storage (or during setup)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await initializeStorage()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Storage initialized successfully' 
      })
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Storage initialization error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get storage info
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    bucket: 'post-images',
    maxFileSize: '5MB',
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    maxFiles: 4
  })
}
