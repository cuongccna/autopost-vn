import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BUFFER_CLIENT_ID = process.env.BUFFER_CLIENT_ID;
const BUFFER_CLIENT_SECRET = process.env.BUFFER_CLIENT_SECRET;
const BUFFER_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/buffer/callback`;

/**
 * Buffer OAuth Flow
 * Step 1: Redirect to Buffer authorization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'connect') {
      // Redirect to Buffer OAuth
      const authUrl = new URL('https://bufferapp.com/oauth2/authorize');
      authUrl.searchParams.set('client_id', BUFFER_CLIENT_ID || '');
      authUrl.searchParams.set('redirect_uri', BUFFER_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', session.user.email); // Use email as state for security

      return NextResponse.redirect(authUrl.toString());
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Buffer OAuth Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
