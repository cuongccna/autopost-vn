'use client'

import React from 'react'
import Link from 'next/link'

interface InputFieldProps {
  label: string
  type: string
  value: string
  onChange: (_value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
}

export function InputField({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error 
}: InputFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={required}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary',
  loading = false,
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClass = "w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
  
  const variantClass = variant === 'primary' 
    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100"

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý...
        </>
      ) : children}
    </button>
  )
}

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              AutoPost VN
            </h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export function Alert({ type, message, onClose }: AlertProps) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`border rounded-lg p-4 mb-4 ${colors[type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 font-bold">{icons[type]}</span>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
