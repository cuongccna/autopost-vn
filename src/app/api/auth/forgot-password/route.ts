import { NextRequest, NextResponse } from 'next/server'
import { query, update } from '@/lib/db/postgres'
import { emailService } from '@/lib/services/emailService'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Find user by email
    const userResult = await query(
      'SELECT id, email FROM autopostvn_users WHERE email = $1 LIMIT 1',
      [email]
    )

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
      })
    }

    const user = userResult.rows[0]

    // Generate reset token
    const resetToken = uuidv4()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Update user with reset token
    await update(
      'autopostvn_users',
      {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString()
      },
      { id: user.id }
    )

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    )
  }
}
