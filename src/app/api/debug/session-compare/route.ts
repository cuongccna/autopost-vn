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

    const sessionUserId = (session.user as any).id;
    const sessionEmail = session.user.email;
    const sessionRole = (session.user as any).role;
    
    console.log('🔍 Session data:', { sessionUserId, sessionEmail, sessionRole });

    const supabase = sbServer(true); // Use service role

    // 1. Find user by email in database
    const { data: userByEmail, error: emailError } = await supabase
      .from('autopostvn_users')
      .select('*')
      .eq('email', sessionEmail)
      .single();

    console.log('📧 User by email:', userByEmail);

    // 2. Find user by ID in database
    const { data: userById, error: idError } = await supabase
      .from('autopostvn_users')
      .select('*')
      .eq('id', sessionUserId)
      .single();

    console.log('🆔 User by ID:', userById);

    // 3. Check which user the AI usage API would use
    const usageStatsUserId = sessionUserId || sessionEmail;
    console.log('🧠 AI usage service would use:', usageStatsUserId);

    // 4. Get AI stats for both users if different
    let aiStatsByEmail = null;
    let aiStatsById = null;

    if (userByEmail) {
      const { data: statsByEmail, error: statsEmailError } = await supabase
        .rpc('check_ai_rate_limit', {
          p_user_id: userByEmail.id,
          p_user_role: userByEmail.user_role
        });
      aiStatsByEmail = { stats: statsByEmail, error: statsEmailError };
    }

    if (userById && userById.id !== userByEmail?.id) {
      const { data: statsById, error: statsIdError } = await supabase
        .rpc('check_ai_rate_limit', {
          p_user_id: userById.id,
          p_user_role: userById.user_role
        });
      aiStatsById = { stats: statsById, error: statsIdError };
    }

    return NextResponse.json({
      session: {
        userId: sessionUserId,
        email: sessionEmail,
        role: sessionRole
      },
      database: {
        userByEmail: userByEmail || null,
        userById: userById || null,
        emailError: emailError?.message || null,
        idError: idError?.message || null
      },
      aiStats: {
        byEmail: aiStatsByEmail,
        byId: aiStatsById
      },
      analysis: {
        sameUser: userByEmail?.id === userById?.id,
        sessionMatchesDatabase: sessionUserId === userByEmail?.id,
        potentialIssue: sessionUserId !== userByEmail?.id
      }
    });

  } catch (error) {
    console.error('💥 Session compare error:', error);
    return NextResponse.json(
      { error: 'Compare failed', details: error },
      { status: 500 }
    );
  }
}
