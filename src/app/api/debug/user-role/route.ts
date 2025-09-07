import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'autopostvn' }
  }
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    
    console.log('🔍 Checking user role for:', userEmail, 'ID:', userId);

    // Check in users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    console.log('Users query result:', { users, usersError });

    // Also check by email
    const { data: usersByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail);

    console.log('Users by email result:', { usersByEmail, emailError });

    // Check all users to see what's in the table
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(10);

    console.log('All users sample:', { allUsers, allError });

    return NextResponse.json({
      session_user: {
        id: userId,
        email: userEmail,
        name: (session.user as any).name
      },
      users_table_by_id: users,
      users_table_by_email: usersByEmail,
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
