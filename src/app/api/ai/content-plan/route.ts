import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAIRateLimit, logAIUsage } from '@/lib/services/aiUsageService';
import { createContentPlan } from '@/lib/services/aiContentPlanner';
import type { AIContentPlannerRequest } from '@/types/ai';
import { throttleContentPlanRequest } from '@/lib/utils/content-plan-throttle';

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = (session.user as any).id;
    const userRole = (session.user as any).user_role || 'free';

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const rateLimitCheck = await checkAIRateLimit(userId, userRole);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as AIContentPlannerRequest;
    const {
      startDate,
      endDate,
      preferredPlatforms,
      cadencePerWeek,
    } = body;

    if (!startDate || !endDate || !preferredPlatforms?.length || !cadencePerWeek) {
      return NextResponse.json(
        { error: 'startDate, endDate, cadencePerWeek và preferredPlatforms là bắt buộc.' },
        { status: 400 }
      );
    }

    const cadence = Number(cadencePerWeek);
    if (!Number.isFinite(cadence) || cadence <= 0) {
      return NextResponse.json(
        { error: 'cadencePerWeek phải là số dương.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    await throttleContentPlanRequest(userId);

    const plan = await createContentPlan({
      ...body,
      cadencePerWeek: cadence,
    });

    await logAIUsage(userId, 'content_plan', true, 0);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Content plan generation error:', error);

    if (userId) {
      await logAIUsage(
        userId,
        'content_plan',
        false,
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tạo kế hoạch nội dung' },
      { status: 500 }
    );
  }
}
