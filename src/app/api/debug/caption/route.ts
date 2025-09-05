import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Debug Caption API Request:', {
      body,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
    
    // Forward to actual caption API
    const response = await fetch(`${request.nextUrl.origin}/api/ai/caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authentication headers
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body)
    });
    
    const responseData = await response.text();
    
    console.log('Debug Caption API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      debug: true,
      request: body,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseData.length > 1000 ? responseData.substring(0, 1000) + '...' : responseData
      }
    });
    
  } catch (error) {
    console.error('Debug caption error:', error);
    
    return NextResponse.json({
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
