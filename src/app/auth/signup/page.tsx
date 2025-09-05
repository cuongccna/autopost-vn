'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout, InputField, Button, Alert } from '@/components/auth/AuthComponents'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ tên')
      return false
    }

    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ')
      return false
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return false
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setSuccess('Tài khoản đã được tạo thành công! Đang chuyển hướng...')
      
      // Redirect to sign in page after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin' as any)
      }, 2000)

    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      subtitle="Tạo tài khoản AutoPost VN miễn phí"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert 
            type="error" 
            message={error} 
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert 
            type="success" 
            message={success}
          />
        )}

        <InputField
          label="Họ và tên"
          type="text"
          value={fullName}
          onChange={setFullName}
          placeholder="Nguyễn Văn A"
          required
        />

        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          required
        />

        <InputField
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
        />

        <InputField
          label="Xác nhận mật khẩu"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          required
        />

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            Tôi đồng ý với{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Điều khoản sử dụng
            </Link>
            {' '}và{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Chính sách bảo mật
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!fullName || !email || !password || !confirmPassword}
        >
          Tạo tài khoản
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Đăng nhập ngay
          </Link>
        </span>
      </div>
    </AuthLayout>
  )
}
