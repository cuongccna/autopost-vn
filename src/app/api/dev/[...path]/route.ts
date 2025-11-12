import { NextResponse } from 'next/server';

// Catch-all route for /api/dev/*
// Returns 503 Service Unavailable for all dev endpoints during PostgreSQL migration
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Development endpoints temporarily unavailable during PostgreSQL migration',
      status: 'not_implemented' 
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Development endpoints temporarily unavailable during PostgreSQL migration',
      status: 'not_implemented' 
    },
    { status: 503 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Development endpoints temporarily unavailable during PostgreSQL migration',
      status: 'not_implemented' 
    },
    { status: 503 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Development endpoints temporarily unavailable during PostgreSQL migration',
      status: 'not_implemented' 
    },
    { status: 503 }
  );
}
