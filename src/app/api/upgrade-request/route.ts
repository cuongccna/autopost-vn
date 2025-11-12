import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db/postgres';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetPlan } = body;

    if (!targetPlan || !['professional', 'enterprise'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Get user info from database
    const userId = (session.user as any).id || session.user.email;

    console.log('🔍 Looking up user in database:', {
      userId,
      email: session.user.email
    });

    // Find user by id
    const userResult = await query(
      'SELECT id, email, full_name, user_role FROM autopostvn_users WHERE id = $1 LIMIT 1',
      [userId]
    );

    let dbUser = userResult.rows.length > 0 ? userResult.rows[0] : null;

    if (!dbUser) {
      // Fallback: Try to find by email
      console.log('⚠️ User not found by id, trying email:', session.user.email);
      const userByEmailResult = await query(
        'SELECT id, email, full_name, user_role FROM autopostvn_users WHERE email = $1 LIMIT 1',
        [session.user.email]
      );

      if (userByEmailResult.rows.length > 0) {
        dbUser = userByEmailResult.rows[0];
        console.log('✓ Found user by email');
      }
    }

    if (!dbUser) {
      console.error('❌ User not found in database:', {
        userId,
        email: session.user.email
      });

      return NextResponse.json(
        {
          error: 'User not found in database',
          details: 'Please contact admin: cuong.vhcc@gmail.com'
        },
        { status: 404 }
      );
    }

    console.log('✓ User found:', {
      id: dbUser.id,
      email: dbUser.email,
      currentRole: dbUser.user_role
    });

    // Check if user is already on this plan or higher
    const planHierarchy = { free: 0, professional: 1, enterprise: 2 };
    const currentPlanLevel = planHierarchy[dbUser.user_role as keyof typeof planHierarchy] || 0;
    const targetPlanLevel = planHierarchy[targetPlan as keyof typeof planHierarchy];

    if (currentPlanLevel >= targetPlanLevel) {
      return NextResponse.json(
        { error: 'You are already on this plan or higher' },
        { status: 400 }
      );
    }

    // Create activation token (expires in 7 days)
    const activationToken = jwt.sign(
      {
        userId: dbUser.id,
        authUserId: userId,
        targetPlan,
        email: dbUser.email,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    // Send email to admin
    const emailSent = await emailService.sendUpgradeRequestToAdmin({
      userName: dbUser.full_name || dbUser.email,
      userEmail: dbUser.email,
      targetPlan,
      userId: dbUser.id,
      activationToken
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send upgrade request email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Upgrade request sent successfully. Admin will activate your account after payment confirmation.'
    });

  } catch (error) {
    console.error('Upgrade request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
