// AutoPost VN - Main API Route Handler
// Centralized API endpoint for all backend operations

import { NextRequest, NextResponse } from 'next/server';
import { BackendController } from '@/lib/backend/controllers/main';

// Initialize backend controller
const backendController = new BackendController({
  database: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    schema: process.env.SUPABASE_SCHEMA || 'AutoPostVN'
  },
  encryptionKey: process.env.ENCRYPTION_KEY || 'fallback-key-for-development'
});

export async function GET(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const { action } = params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action[0]) {
      case 'posts':
        if (action[1]) {
          // GET /api/v1/posts/{id}
          return NextResponse.json(await backendController.getPost(action[1]));
        } else {
          // GET /api/v1/posts
          return NextResponse.json(await backendController.getPosts(workspaceId));
        }

      case 'accounts':
        if (action[1] === 'health' && action[2]) {
          // GET /api/v1/accounts/health/{id}
          return NextResponse.json(await backendController.checkAccountHealth(action[2]));
        } else {
          // GET /api/v1/accounts
          return NextResponse.json(await backendController.getSocialAccounts(workspaceId));
        }

      case 'analytics':
        const subAction = action[1];
        switch (subAction) {
          case 'posts':
            return NextResponse.json(await backendController.getPostAnalytics(workspaceId));
          case 'accounts':
            return NextResponse.json(await backendController.getAccountPerformance(workspaceId));
          case 'engagement':
            const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'week';
            return NextResponse.json(await backendController.getEngagementStats(workspaceId, timeframe));
          case 'optimal-times':
            return NextResponse.json(await backendController.getOptimalPostingTimes(workspaceId));
          case 'errors':
            return NextResponse.json(await backendController.getErrorAnalysis(workspaceId));
          default:
            return NextResponse.json(
              { success: false, error: 'Invalid analytics endpoint' },
              { status: 404 }
            );
        }

      case 'dashboard':
        // GET /api/v1/dashboard
        return NextResponse.json(await backendController.getDashboardData(workspaceId));

      case 'health':
        // GET /api/v1/health
        return NextResponse.json(await backendController.getSystemHealth());

      default:
        return NextResponse.json(
          { success: false, error: 'Endpoint not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const { action } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action[0]) {
      case 'posts':
        if (action[1] === 'reschedule' && action[2]) {
          // POST /api/v1/posts/reschedule/{id}
          const { scheduledAt } = body;
          return NextResponse.json(
            await backendController.reschedulePost(action[2], scheduledAt)
          );
        } else {
          // POST /api/v1/posts
          return NextResponse.json(
            await backendController.createPost(workspaceId, body)
          );
        }

      case 'accounts':
        if (action[1] === 'refresh' && action[2]) {
          // POST /api/v1/accounts/refresh/{id}
          return NextResponse.json(
            await backendController.refreshSocialAccountToken(action[2])
          );
        } else {
          // POST /api/v1/accounts
          return NextResponse.json(
            await backendController.connectSocialAccount(workspaceId, body)
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Endpoint not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const { action } = params;
    const body = await request.json();

    switch (action[0]) {
      case 'posts':
        if (action[1]) {
          // PUT /api/v1/posts/{id}
          return NextResponse.json(
            await backendController.updatePost(action[1], body)
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Endpoint not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const { action } = params;

    switch (action[0]) {
      case 'posts':
        if (action[1]) {
          // DELETE /api/v1/posts/{id}
          return NextResponse.json(
            await backendController.deletePost(action[1])
          );
        }
        break;

      case 'accounts':
        if (action[1]) {
          // DELETE /api/v1/accounts/{id}
          return NextResponse.json(
            await backendController.disconnectSocialAccount(action[1])
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Endpoint not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
