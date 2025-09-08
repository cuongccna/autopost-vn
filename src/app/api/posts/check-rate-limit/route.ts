import { NextResponse } from 'next/server'

// EMERGENCY FIX: Return 404 in development to prevent infinite loop
export async function GET() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Rate limit API called - returning 404 to prevent infinite loop');
    return new NextResponse('API disabled in development to prevent infinite loop', { 
      status: 404 
    });
  }
  
  // For production, return mock data for now
  return NextResponse.json({
    allowed: true,
    stats: {
      monthlyUsage: 0,
      monthlyLimit: 100,
      weeklyUsage: 0,
      dailyUsage: 0,
      userRole: 'professional',
      allowed: true
    },
    userRole: 'professional'
  });
}
