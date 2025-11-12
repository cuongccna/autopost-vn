import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/services/UserManagementService';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Fetching accounts for user:', session.user.email);

    const accounts = await userManagementService.getUserSocialAccounts(
      session.user.email
    );

    console.log('📦 Found accounts:', accounts.length, accounts);

    return NextResponse.json({ 
      success: true,
      accounts: accounts,
      count: accounts.length 
    });
  } catch (error) {
    console.error('❌ Get user accounts error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounts',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await userManagementService.disconnectAccount(accountId, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, accountId } = await request.json();

    if (action === 'refresh_token') {
      if (!accountId) {
        return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
      }

      // TODO: Implement token refresh functionality
      // const updatedAccount = await userManagementService.refreshAccountToken(accountId);
      return NextResponse.json({
        message: 'Token refresh not implemented yet',
        accountId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('User accounts API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
