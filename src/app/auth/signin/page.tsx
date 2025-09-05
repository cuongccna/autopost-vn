'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout, InputField, Button, Alert } from '@/components/auth/AuthComponents'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng')
      } else {
        router.push('/app' as any)
      }
    } catch (error) {
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng quay trở lại AutoPost VN"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert 
            type="error" 
            message={error} 
            onClose={() => setError('')}
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

        <InputField
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!email || !password}
        >
          Đăng nhập
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Đăng ký ngay
            </Link>
          </span>
        </div>
      </div>
    </AuthLayout>
  )
}
