'use client'

import { useState, useEffect } from 'react'
import Link from '@/components/ui/Link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'

// QR Code component
function QRCodeSection() {
  const [qrCode, setQrCode] = useState('')

  useEffect(() => {
    // Generate QR code for mobile access
    const generateQR = async () => {
      try {
        const QRCode = (await import('qrcode')).default
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const qrString = await QRCode.toDataURL(appUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1D4ED8',
            light: '#FFFFFF'
          }
        })
        setQrCode(qrString)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [])

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Truy cập nhanh trên Mobile
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Quét mã QR để mở AutoPost VN trên điện thoại
        </p>
        
        {qrCode && (
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <img src={qrCode} alt="QR Code" className="mx-auto" />
              <p className="mt-4 text-sm text-gray-500">
                Quét mã này bằng camera điện thoại
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      // @ts-ignore - Next.js route type checking is too strict
      router.push('/app')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render landing page if user is authenticated
  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">AutoPost VN</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Tự động đăng bài lên
              <span className="text-blue-600"> mạng xã hội</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AutoPost VN giúp bạn lập lịch và tự động đăng bài lên Facebook, Instagram, Zalo. 
              Tiết kiệm thời gian và tăng hiệu quả marketing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Bắt đầu miễn phí
              </Link>
              <Link
                href="#features"
                className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Tất cả những gì bạn cần để quản lý mạng xã hội hiệu quả
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lập lịch thông minh</h3>
              <p className="text-gray-600">
                Đặt lịch đăng bài tự động theo thời gian tối ưu để đạt được engagement cao nhất
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Đa nền tảng</h3>
              <p className="text-gray-600">
                Kết nối và đăng bài đồng thời lên Facebook, Instagram, Zalo từ một nơi duy nhất
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thống kê chi tiết</h3>
              <p className="text-gray-600">
                Theo dõi hiệu quả đăng bài với báo cáo chi tiết về reach, engagement và conversion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      <QRCodeSection />

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cùng hàng nghìn người dùng đang sử dụng AutoPost VN
          </p>
          <Link
            href="/auth/signup"
            className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Đăng ký ngay - Miễn phí
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
