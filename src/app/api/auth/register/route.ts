import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers.users.find(user => user.email === email)
    if (userExists) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản: ' + authError.message },
        { status: 400 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        avatar_url: '',
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    // Create default workspace for user
    const { error: workspaceError } = await supabase
      .from('"AutoPostVN".workspaces')
      .insert({
        name: `${fullName}'s Workspace`,
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: 'Workspace mặc định',
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('Workspace creation error:', workspaceError)
    }

    return NextResponse.json({
      success: true,
      message: 'Tài khoản đã được tạo thành công',
      user: {
        id: authData.user.id,
        email: authData.user.email,
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
