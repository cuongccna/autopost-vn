import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    
    console.log('🔍 Checking user role for:', userEmail, 'ID:', userId);

    // Check in autopostvn_users table
    const usersResult = await query(
      'SELECT * FROM autopostvn_users WHERE id = $1',
      [userId]
    );

    const users = usersResult.rows;
    const usersError = usersResult.rows.length === 0 ? 'No user found' : null;

    console.log('Users query result:', { users, usersError });

    // Also check by email
    const usersByEmailResult = await query(
      'SELECT * FROM autopostvn_users WHERE email = $1',
      [userEmail]
    );

    const usersByEmail = usersByEmailResult.rows;
    const emailError = usersByEmailResult.rows.length === 0 ? 'No user found by email' : null;

    console.log('Users by email result:', { usersByEmail, emailError });

    // Check all users to see what's in the table
    const allUsersResult = await query(
      'SELECT id, email, user_role, created_at FROM autopostvn_users ORDER BY created_at DESC LIMIT 10'
    );

    const allUsers = allUsersResult.rows;
    const allError = null;

    console.log('All users sample:', { allUsers, allError });

    return NextResponse.json({
      session_user: {
        id: userId,
        email: userEmail,
        name: (session.user as any).name
      },
      autopostvn_users_table_by_id: users,
      autopostvn_users_table_by_email: usersByEmail,
      all_users_sample: allUsers,
      errors: {
        usersError,
        emailError,
        allError
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking user role:', error);
    return NextResponse.json({ 
      error: 'Failed to check user role', 
      details: error.message 
    }, { status: 500 });
  }
}
