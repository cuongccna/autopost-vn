import { NextRequest, NextResponse } from 'next/server'
import { query, update } from '@/lib/db/postgres'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token và mật khẩu mới là bắt buộc' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Find user by reset token and check if token is not expired
    const userResult = await query(`
      SELECT id, email
      FROM autopostvn_users
      WHERE password_reset_token = $1
        AND password_reset_expires > NOW()
      LIMIT 1
    `, [token])

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    const user = userResult.rows[0]

    // Hash new password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update user password and clear reset token
    await update(
      'autopostvn_users',
      {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
        login_attempts: 0, // Reset login attempts
        locked_until: null // Unlock account if locked
      },
      { id: user.id }
    )

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    )
  }
}
