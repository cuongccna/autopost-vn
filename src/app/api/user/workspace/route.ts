import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

// GET /api/user/workspace - Get current user's workspace
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      );
    }
    
    // Get user's workspace
    const workspaceResult = await query(
      `SELECT id, name, slug FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    
    if (!workspaceResult.rows[0]) {
      return NextResponse.json(
        { error: 'No workspace found for user' },
        { status: 404 }
      );
    }
    
    const workspace = workspaceResult.rows[0];
    
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug
      }
    });
    
  } catch (error) {
    console.error('Get user workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
