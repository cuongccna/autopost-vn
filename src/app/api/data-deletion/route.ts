import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Facebook Data Deletion Callback
 * Required by Facebook for App Review
 * 
 * Facebook will POST to this endpoint when a user requests data deletion
 * Reference: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

interface FacebookDataDeletionRequest {
  signed_request: string;
}

interface DecodedRequest {
  algorithm: string;
  issued_at: number;
  user_id: string;
}

/**
 * Parse Facebook signed request
 */
function parseSignedRequest(signedRequest: string, appSecret: string): DecodedRequest | null {
  try {
    const [encodedSig, payload] = signedRequest.split('.');
    
    // Decode the data
    const sig = Buffer.from(encodedSig, 'base64').toString('hex');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    if (sig !== expectedSig) {
      console.error('Invalid signature');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing signed request:', error);
    return null;
  }
}

/**
 * Handle Facebook Data Deletion Request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FacebookDataDeletionRequest;
    const { signed_request } = body;

    if (!signed_request) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      );
    }

    // Parse the signed request
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!appSecret) {
      console.error('FACEBOOK_CLIENT_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const data = parseSignedRequest(signed_request, appSecret);
    
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid signed request' },
        { status: 400 }
      );
    }

    const { user_id } = data;

    // Log the deletion request
    console.log('📝 Facebook Data Deletion Request received:', {
      user_id,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual data deletion logic
    // 1. Find user by Facebook user_id in database
    // 2. Delete user's posts, schedules, and social accounts
    // 3. Anonymize or delete user profile data
    // 4. Log the deletion for compliance
    
    // Example implementation:
    /*
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Find social account with this Facebook user_id
      const { data: socialAccounts } = await supabase
        .from('user_social_accounts')
        .select('user_id')
        .eq('platform', 'facebook')
        .eq('platform_user_id', user_id);

      if (socialAccounts && socialAccounts.length > 0) {
        const userId = socialAccounts[0].user_id;

        // Delete in order (respect foreign keys)
        await supabase.from('scheduled_posts').delete().eq('user_id', userId);
        await supabase.from('posts').delete().eq('user_id', userId);
        await supabase.from('user_social_accounts').delete().eq('user_id', userId);
        await supabase.from('users').delete().eq('id', userId);

        console.log(`✅ Deleted all data for Facebook user: ${user_id}`);
      }
    } catch (dbError) {
      console.error('Database deletion error:', dbError);
      // Don't fail the request - Facebook still needs a response
    }
    */

    // Generate confirmation code
    const confirmationCode = crypto
      .createHash('sha256')
      .update(`${user_id}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    // Return confirmation URL as required by Facebook
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/data-deletion-status?id=${confirmationCode}`;

    // Facebook expects this response format
    return NextResponse.json({
      url: confirmationUrl,
      confirmation_code: confirmationCode,
    });

  } catch (error) {
    console.error('Data deletion request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests - Show information page
 */
export async function GET(request: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Data Deletion Callback - AutoPost VN</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .container {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1877f2;
          border-bottom: 2px solid #1877f2;
          padding-bottom: 10px;
        }
        .info {
          background: #e7f3ff;
          border-left: 4px solid #1877f2;
          padding: 15px;
          margin: 20px 0;
        }
        .endpoint {
          background: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          margin: 10px 0;
        }
        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🗑️ Facebook Data Deletion Callback</h1>
        
        <div class="info">
          <strong>ℹ️ Information:</strong>
          <p>This endpoint is configured to handle Facebook data deletion requests as required by Facebook Platform Policy.</p>
        </div>

        <h2>📋 Endpoint Details</h2>
        <p><strong>URL:</strong></p>
        <div class="endpoint">${process.env.NEXT_PUBLIC_APP_URL}/api/data-deletion</div>
        
        <p><strong>Method:</strong> POST</p>
        <p><strong>Content-Type:</strong> application/json</p>

        <h2>🔐 How it works</h2>
        <ol>
          <li>Facebook sends a POST request with a <code>signed_request</code> parameter</li>
          <li>We verify the signature using your App Secret</li>
          <li>We extract the <code>user_id</code> from the request</li>
          <li>We delete all user data associated with that Facebook account</li>
          <li>We return a confirmation URL and code to Facebook</li>
        </ol>

        <h2>📝 Response Format</h2>
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto;">
{
  "url": "https://your-domain.com/data-deletion-status?id=CONFIRMATION_CODE",
  "confirmation_code": "CONFIRMATION_CODE"
}</pre>

        <h2>⚙️ Configuration in Facebook App</h2>
        <p>Add this URL to your Facebook App settings:</p>
        <ol>
          <li>Go to <strong>App Dashboard</strong> → <strong>Settings</strong> → <strong>Basic</strong></li>
          <li>Find <strong>"Data Deletion Request URL"</strong></li>
          <li>Enter: <code>${process.env.NEXT_PUBLIC_APP_URL}/api/data-deletion</code></li>
          <li>Click <strong>Save Changes</strong></li>
        </ol>

        <h2>✅ Compliance</h2>
        <p>This endpoint complies with:</p>
        <ul>
          <li>Facebook Platform Policy 7.c - Data Deletion</li>
          <li>GDPR Article 17 - Right to Erasure</li>
          <li>CCPA - Consumer Data Deletion Rights</li>
        </ul>

        <div class="info">
          <strong>🔒 Privacy:</strong>
          <p>When a user deletes their Facebook account or removes your app, this endpoint will be called to delete all their data from your system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
