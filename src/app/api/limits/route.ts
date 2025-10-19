import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getScopedLimit, getUnifiedLimits } from '@/lib/services/limitsService';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const userRole = (session.user as any).user_role || 'free';

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') as 'ai' | 'posts' | null;

  try {
    if (scope === 'ai' || scope === 'posts') {
      const result = await getScopedLimit(userId, userRole, scope);
      return NextResponse.json({ scope, ...result });
    }

    const result = await getUnifiedLimits(userId, userRole);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch limits' }, { status: 500 });
  }
}

