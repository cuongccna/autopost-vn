import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sbServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv
    
    const supabase = sbServer(true);

    console.log('📦 Export: Fetching workspace for user:', userId);

    // Get user's workspace - try created_by first, then any workspace
    let { data: workspaces, error: workspaceError } = await supabase
      .from('autopostvn_workspaces')
      .select('id')
      .eq('created_by', userId)
      .limit(1);

    // If no workspace created by user, find first available workspace
    if (!workspaces || workspaces.length === 0) {
      console.log('📦 Export: No owned workspace, finding any accessible workspace');
      const { data: allWorkspaces } = await supabase
        .from('autopostvn_workspaces')
        .select('id')
        .limit(1);
      
      workspaces = allWorkspaces;
    }

    console.log('📦 Export: Workspaces found:', workspaces);

    if (!workspaces || workspaces.length === 0) {
      console.error('❌ Export: No workspace found for user');
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const workspaceId = workspaces[0].id;
    console.log('📦 Export: Using workspace:', workspaceId);

    // Fetch all data
    const [postsResult, accountsResult, logsResult] = await Promise.all([
      supabase
        .from('autopostvn_scheduled_posts')
        .select('*')
        .eq('workspace_id', workspaceId),
      
      supabase
        .from('autopostvn_user_social_accounts')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('autopostvn_activity_logs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(100), // Limit logs to last 100
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_email: session.user.email,
      data: {
        posts: postsResult.data || [],
        social_accounts: accountsResult.data || [],
        activity_logs: logsResult.data || [],
      },
      summary: {
        total_posts: postsResult.data?.length || 0,
        total_accounts: accountsResult.data?.length || 0,
        total_logs: logsResult.data?.length || 0,
      }
    };

    if (format === 'csv') {
      // Convert to CSV (simple implementation)
      const csv = convertToCSV(exportData);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="autopostvn-export-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="autopostvn-export-${Date.now()}.json"`,
      },
    });

  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const posts = data.data.posts || [];
  const accounts = data.data.social_accounts || [];
  
  let csv = 'AUTOPOST VN - DATA EXPORT\n';
  csv += `Exported at: ${data.exported_at}\n`;
  csv += `User: ${data.user_email}\n\n`;
  
  // Posts CSV
  csv += '=== SCHEDULED POSTS ===\n';
  csv += 'ID,Title,Content,Scheduled At,Status,Providers\n';
  posts.forEach((post: any) => {
    csv += `"${post.id}","${post.title || ''}","${(post.content || '').replace(/"/g, '""')}","${post.scheduled_at || ''}","${post.status || ''}","${(post.providers || []).join(', ')}"\n`;
  });
  
  csv += '\n=== SOCIAL ACCOUNTS ===\n';
  csv += 'ID,Provider,Account Name,Status,Connected At\n';
  accounts.forEach((acc: any) => {
    csv += `"${acc.id}","${acc.provider}","${acc.account_name || ''}","${acc.status}","${acc.created_at}"\n`;
  });
  
  return csv;
}
