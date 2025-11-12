import { NextRequest, NextResponse } from 'next/server'
import { query, insert } from '@/lib/db/postgres'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Check if user already exists in users table
    const existingUser = await query(
      'SELECT * FROM autopostvn_users WHERE email = $1 LIMIT 1',
      [email]
    )
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    // Create user in users table
    const userData = {
      id: userId,
      email: email,
      full_name: fullName,
      password_hash: hashedPassword,
      user_role: 'free',
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const newUser = await insert('autopostvn_users', userData)

    if (!newUser || newUser.length === 0) {
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản' },
        { status: 500 }
      )
    }

    // Auto-create default workspace for user
    const workspaceSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
    const workspaceData = {
      user_id: userId,
      name: `${fullName}'s Workspace`,
      slug: workspaceSlug,
      description: 'Workspace mặc định',
      settings: JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date()
    }

    await insert('autopostvn_workspaces', workspaceData)

    return NextResponse.json({
      success: true,
      message: 'Tài khoản đã được tạo thành công. Bạn có thể đăng nhập ngay.',
      user: {
        id: userId,
        email: email,
        fullName: fullName
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    )
  }
}
