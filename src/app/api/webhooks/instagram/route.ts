import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

// Force dynamic rendering for webhook endpoints
export const dynamic = 'force-dynamic';

/**
 * Instagram Webhook Verification (GET)
 * Called by Instagram to verify the webhook endpoint
 * https://developers.facebook.com/docs/instagram-api/guides/webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('📞 [Instagram Webhook] Verification request:', {
      mode,
      token: token ? '***' : undefined,
      challenge: challenge ? '***' : undefined,
    });

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ [Instagram Webhook] Verification successful');
      // Respond with the challenge to confirm subscription
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.error('❌ [Instagram Webhook] Verification failed:', {
      mode,
      tokenMatch: token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
    });

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  } catch (error) {
    console.error('❌ [Instagram Webhook] Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Instagram Webhook Event Handler (POST)
 * Receives real-time updates from Instagram
 * 
 * Possible events:
 * - comments: New comments on media
 * - mentions: User mentions in stories/posts
 * - live_comments: Comments on live videos
 * - messaging_handovers: Message handover events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 [Instagram Webhook] Received event:', {
      object: body.object,
      entries: body.entry?.length || 0,
    });

    // Instagram sends events in this format:
    // {
    //   "object": "instagram",
    //   "entry": [
    //     {
    //       "id": "instagram-account-id",
    //       "time": 1569262486134,
    //       "changes": [...]
    //     }
    //   ]
    // }

    if (body.object !== 'instagram') {
      console.warn('⚠️ [Instagram Webhook] Invalid object type:', body.object);
      return NextResponse.json({ success: true }); // Still return 200 to avoid retries
    }

    // Process each entry
    for (const entry of body.entry || []) {
      const instagramAccountId = entry.id;
      const timestamp = entry.time;

      // Process each change
      for (const change of entry.changes || []) {
        const field = change.field; // e.g., 'comments', 'mentions'
        const value = change.value;

        console.log('🔔 [Instagram Webhook] Processing change:', {
          instagramAccountId,
          field,
          valueKeys: Object.keys(value || {}),
        });

        try {
          // Handle different event types
          switch (field) {
            case 'comments':
              await handleCommentEvent(instagramAccountId, value);
              break;
            
            case 'mentions':
              await handleMentionEvent(instagramAccountId, value);
              break;
            
            case 'live_comments':
              await handleLiveCommentEvent(instagramAccountId, value);
              break;
            
            default:
              console.log(`ℹ️ [Instagram Webhook] Unhandled field type: ${field}`);
          }
        } catch (eventError) {
          console.error(`❌ [Instagram Webhook] Error processing ${field} event:`, eventError);
          // Continue processing other events even if one fails
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [Instagram Webhook] Error processing event:', error);
    // Still return 200 to prevent Instagram from retrying
    return NextResponse.json({ success: true });
  }
}

/**
 * Handle comment events
 */
async function handleCommentEvent(instagramAccountId: string, value: any) {
  console.log('💬 [Instagram] New comment event:', {
    mediaId: value.media_id,
    commentId: value.id,
    text: value.text?.substring(0, 50),
  });

  // TODO: Implement comment handling logic
  // - Store comment in database
  // - Send notification to user
  // - Auto-reply if configured
  
  // Example: Log to activity logs
  try {
    await query(`
      INSERT INTO autopostvn_system_activity_logs (
        user_id, action_type, action_category, description, 
        target_resource_type, target_resource_id, additional_data, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      null, // We'd need to lookup user_id from instagram account id
      'instagram_comment_received',
      'social',
      `New comment on Instagram media: ${value.text?.substring(0, 100)}`,
      'instagram_media',
      value.media_id,
      JSON.stringify({
        comment_id: value.id,
        text: value.text,
        instagram_account_id: instagramAccountId,
      }),
    ]);
  } catch (logError) {
    console.error('Failed to log comment event:', logError);
  }
}

/**
 * Handle mention events (when someone mentions you in a story/post)
 */
async function handleMentionEvent(instagramAccountId: string, value: any) {
  console.log('📣 [Instagram] New mention event:', {
    mediaId: value.media_id,
    commentId: value.comment_id,
  });

  // TODO: Implement mention handling logic
  // - Notify user of mention
  // - Track mentions for analytics
}

/**
 * Handle live video comment events
 */
async function handleLiveCommentEvent(instagramAccountId: string, value: any) {
  console.log('🎥 [Instagram] New live comment event:', {
    broadcastId: value.broadcast_id,
    commentId: value.id,
  });

  // TODO: Implement live comment handling logic
}
