import { NextRequest, NextResponse } from 'next/server';

// GET /api/test/activity-logs - Test activity logs system
export async function GET(request: NextRequest) {
  try {
    // Chỉ cho phép trong development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Test endpoint only available in development' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'basic';
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Test basic functionality that can return results
    if (testType === 'basic') {
      const { ActivityLogService } = await import('@/lib/services/activity-log.service');
      const { ACTION_TYPES, createLogDescription } = await import('@/types/activity-logs');
      
      // Test description creation
      const descriptions = [
        createLogDescription(ACTION_TYPES.AUTH.LOGIN),
        createLogDescription(ACTION_TYPES.POST.CREATE, { title: 'Test Post' }),
        createLogDescription(ACTION_TYPES.ACCOUNT.CONNECT, { provider: 'facebook', name: 'Test Page' })
      ];
      
      results.tests.push({
        name: 'Description Generation',
        status: 'success',
        results: descriptions
      });
      
      // Test stats function (without real data)
      try {
        const stats = await ActivityLogService.getActivityStats('test-user-id', undefined, 7);
        results.tests.push({
          name: 'Stats Function',
          status: 'success',
          results: stats
        });
      } catch (error) {
        results.tests.push({
          name: 'Stats Function',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Activity logs tests completed',
      ...results
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/test/activity-logs - Test creating a log entry
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Test endpoint only available in development' },
        { status: 403 }
      );
    }
    
    const { ActivityLogService } = await import('@/lib/services/activity-log.service');
    const { ACTION_TYPES } = await import('@/types/activity-logs');
    
    const body = await request.json();
    const { userId, actionType, category, description, ...options } = body;
    
    if (!userId || !actionType || !category) {
      return NextResponse.json(
        { error: 'userId, actionType, and category are required' },
        { status: 400 }
      );
    }
    
    // Create test log
    const logData = {
      action_type: actionType,
      action_category: category,
      description: description || `Test action: ${actionType}`,
      status: 'success' as const,
      duration_ms: Math.floor(Math.random() * 1000) + 100,
      additional_data: {
        test: true,
        timestamp: new Date().toISOString(),
        ...options.additionalData
      },
      ...options
    };
    
    const context = {
      ipAddress: request.ip || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'test-agent',
      requestId: `test-${Date.now()}`,
      sessionId: `test-session-${Date.now()}`
    };
    
    const result = await ActivityLogService.log(userId, logData, context);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Test log created successfully',
        log: result
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create log' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Test log creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
