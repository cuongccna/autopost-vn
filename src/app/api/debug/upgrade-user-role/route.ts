import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sbServer } from '@/lib/supabase/server'

// POST /api/debug/upgrade-user-role - Upgrade user role for development
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id;
    const { role } = await request.json();
    
    // Valid roles
    const validRoles = ['free', 'professional', 'enterprise'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role', 
        validRoles 
      }, { status: 400 });
    }

    const supabase = sbServer(true); // Use service role

    // Update user role
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ 
        error: 'Failed to update user role',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `User role updated successfully`,
      user: {
        id: userId,
        role: data.role,
        email: data.email
      }
    });

  } catch (error) {
    console.error('Upgrade user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET method for easier testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use POST method with { "role": "professional" | "enterprise" }' 
  });
}
