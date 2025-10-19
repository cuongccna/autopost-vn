import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';
import { encrypt } from '@/lib/utils/encryption';

const BUFFER_CLIENT_ID = process.env.BUFFER_CLIENT_ID;
const BUFFER_CLIENT_SECRET = process.env.BUFFER_CLIENT_SECRET;
const BUFFER_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/buffer/callback`;

/**
 * Buffer OAuth Callback
 * Step 2: Handle callback and exchange code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=unauthorized`
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors
    if (error) {
      console.error('Buffer OAuth Error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${error}`
      );
    }

    // Validate state
    if (state !== session.user.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=invalid_state`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=no_code`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.bufferapp.com/1/oauth2/token.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: BUFFER_CLIENT_ID || '',
        client_secret: BUFFER_CLIENT_SECRET || '',
        redirect_uri: BUFFER_REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Buffer Token Exchange Error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Buffer profiles
    const profilesResponse = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${accessToken}`
    );

    if (!profilesResponse.ok) {
      console.error('Failed to fetch Buffer profiles');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=profile_fetch_failed`
      );
    }

    const profiles = await profilesResponse.json();

    // Save to database
    const supabase = sbServer(true); // Use service role for database operations

    // Get user ID
    const { data: userData } = await supabase
      .from('users')
      .select('uid')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=user_not_found`
      );
    }

    // Encrypt access token
    const encryptedToken = encrypt(accessToken);

    // Save each profile as a social account
    let savedCount = 0;
    for (const profile of profiles) {
      const { error: insertError } = await supabase
        .from('user_social_accounts')
        .upsert({
          user_id: userData.uid,
          provider: 'buffer',
          platform: profile.service, // facebook, twitter, linkedin, instagram
          account_name: profile.service_username,
          account_id: profile.id,
          access_token: encryptedToken,
          platform_account_id: profile.service_id,
          metadata: {
            formatted_service: profile.formatted_service,
            timezone: profile.timezone,
            buffer_profile_id: profile.id,
          },
        }, {
          onConflict: 'user_id,provider,account_id',
        });

      if (!insertError) {
        savedCount++;
      } else {
        console.error('Error saving Buffer profile:', insertError);
      }
    }

    // Redirect back to accounts page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?success=buffer_connected&count=${savedCount}`
    );
  } catch (error) {
    console.error('Buffer Callback Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=callback_failed`
    );
  }
}
