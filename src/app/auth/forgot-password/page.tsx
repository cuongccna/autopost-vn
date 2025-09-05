'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AuthLayout, InputField, Button, Alert } from '@/components/auth/AuthComponents'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setSuccess(data.message)
      setEmail('')

    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
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
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          required
        />

        <Button
          type="submit"
          loading={loading}
          disabled={!email}
        >
          Gửi email đặt lại mật khẩu
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <div>
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
        
        <div className="text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
