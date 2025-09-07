import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    return NextResponse.json({
      session: {
        user: {
          id: (session.user as any).id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role
        }
      },
      debug: {
        hasRole: !!(session.user as any).role,
        roleValue: (session.user as any).role,
        fullSession: session
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking session:', error);
    return NextResponse.json({ 
      error: 'Failed to check session', 
      details: error.message 
    }, { status: 500 });
  }
}
