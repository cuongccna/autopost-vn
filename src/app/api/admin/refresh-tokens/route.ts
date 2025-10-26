/**
 * Token Refresh API Endpoint
 * 
 * GET /api/admin/refresh-tokens
 * - Manual trigger for token refresh
 * - Shows token expiration status
 * - Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TokenRefreshService from '@/lib/utils/tokenRefreshService';
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
    const action = url.searchParams.get('action');

    const service = new TokenRefreshService();

    // Get status
    if (action === 'status') {
      const summary = await service.getExpirationSummary();
      
      return NextResponse.json({
        success: true,
        summary,
        message: `${summary.healthy} healthy, ${summary.expiringSoon} expiring soon, ${summary.expired} expired`
      });
    }

    // Auto-refresh expiring tokens
    if (action === 'refresh') {
      logger.info('Manual token refresh triggered', {
        userId: (session.user as any).id
      });

      const results = await service.autoRefreshExpiringTokens();

      return NextResponse.json({
        success: true,
        results,
        message: `Refreshed ${results.refreshed} tokens, ${results.failed} failed, ${results.needsManualAuth.length} need manual auth`
      });
    }

    // Default: return status
    const tokens = await service.getTokensNeedingAttention();

    return NextResponse.json({
      success: true,
      tokens: tokens.map(t => ({
        accountName: t.accountName,
        provider: t.provider,
        expiresAt: t.expiresAt,
        daysUntilExpiry: t.daysUntilExpiry === Infinity ? 'Never' : t.daysUntilExpiry,
        status: t.needsManualAuth 
          ? 'Expired - Needs re-auth' 
          : t.needsRefresh 
          ? 'Expiring soon' 
          : 'Healthy'
      }))
    });

  } catch (error: any) {
    logger.error('Token refresh API error', { error: error.message });
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
