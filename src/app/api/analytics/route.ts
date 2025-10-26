/**
 * Analytics API Endpoint
 * 
 * GET /api/analytics?workspace_id=xxx
 * - Returns analytics summary for workspace
 * 
 * GET /api/analytics?workspace_id=xxx&type=best-times
 * - Returns best posting times analysis
 * 
 * GET /api/analytics?workspace_id=xxx&type=posts&limit=10
 * - Returns recent posts with insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import FacebookInsightsService from '@/lib/utils/facebookInsightsService';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const type = url.searchParams.get('type') || 'summary';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    const service = new FacebookInsightsService();

    // Get best posting times
    if (type === 'best-times') {
      logger.info('Fetching best posting times', { workspaceId });
      const bestTimes = await service.getBestPostingTimes(workspaceId);
      
      return NextResponse.json({
        success: true,
        data: bestTimes,
        message: `Found ${bestTimes.length} optimal posting times`
      });
    }

    // Get posts with insights
    if (type === 'posts') {
      logger.info('Fetching posts insights', { workspaceId, limit });
      const posts = await service.getPostsInsights(workspaceId, limit);
      
      return NextResponse.json({
        success: true,
        data: posts,
        count: posts.length
      });
    }

    // Default: Get complete analytics data
    logger.info('Fetching complete analytics', { workspaceId });
    
    const [summary, rawInsights, bestTimes] = await Promise.all([
      service.getAnalyticsSummary(workspaceId),
      service.getPostsInsights(workspaceId, limit),
      service.getBestPostingTimes(workspaceId)
    ]);

    // Flatten insights for easier UI consumption
    const insights = rawInsights.map(insight => ({
      platform_post_id: insight.externalPostId,
      published_at: insight.publishedAt,
      content: insight.content,
      account_name: insight.accountName,
      likes: insight.metrics.likes,
      comments: insight.metrics.comments,
      shares: insight.metrics.shares,
      reach: insight.metrics.reach,
      impressions: insight.metrics.impressions,
      engagement: insight.metrics.engagement,
      engagement_rate: insight.metrics.engagementRate
    }));

    return NextResponse.json({
      summary,
      insights,
      best_posting_times: bestTimes
    });

  } catch (error: any) {
    logger.error('Analytics API error', { error: error.message });
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
