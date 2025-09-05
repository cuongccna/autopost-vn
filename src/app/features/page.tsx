import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tính năng - AutoPost VN',
  description: 'Khám phá các tính năng mạnh mẽ của AutoPost VN - Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam.',
}

export default function FeaturesPage() {
  const features = [
    {
      icon: '🤖',
      title: 'Tự động đăng bài',
      description: 'Lên lịch và đăng bài tự động lên Facebook, Instagram, Zalo OA với một click duy nhất.',
      highlight: true
    },
    {
      icon: '🎯',
      title: 'AI Content Generator',
      description: 'Tạo nội dung, caption, hashtags tự động bằng AI Gemini thông minh và phù hợp với từng platform.',
      highlight: true
    },
    {
      icon: '📊',
      title: 'Phân tích hiệu suất',
      description: 'Theo dõi engagement, reach, clicks và các metrics quan trọng để tối ưu chiến lược content.',
      highlight: false
    },
    {
      icon: '⏰',
      title: 'Lên lịch thông minh',
      description: 'AI gợi ý thời gian đăng tối ưu dựa trên hành vi người dùng và platform analytics.',
      highlight: true
    },
    {
      icon: '🖼️',
      title: 'Quản lý Media',
      description: 'Upload, chỉnh sửa và quản lý hình ảnh, video một cách chuyên nghiệp với cloud storage.',
      highlight: false
    },
    {
      icon: '👥',
      title: 'Quản lý Team',
      description: 'Phân quyền nhóm, workflow duyệt bài và collaboration hiệu quả cho doanh nghiệp.',
      highlight: false
    },
    {
      icon: '📱',
      title: 'Multi-Platform',
      description: 'Hỗ trợ Facebook Pages, Instagram Business, Zalo OA và sẽ mở rộng thêm nhiều platform khác.',
      highlight: true
    },
    {
      icon: '🎨',
      title: 'Template Library',
      description: 'Thư viện template phong phú cho từng ngành nghề, dễ dàng customize theo brand identity.',
      highlight: false
    },
    {
      icon: '📈',
      title: 'Báo cáo chi tiết',
      description: 'Dashboard tổng quan với charts trực quan, export báo cáo PDF và insights chuyên sâu.',
      highlight: false
    },
    {
      icon: '🔐',
      title: 'Bảo mật cao',
      description: 'Mã hóa end-to-end, OAuth 2.0, backup tự động và tuân thủ các tiêu chuẩn bảo mật quốc tế.',
      highlight: false
    },
    {
      icon: '🚀',
      title: 'API Integration',
      description: 'REST API mạnh mẽ để tích hợp với hệ thống CRM, ERP và các tools marketing khác.',
      highlight: false
    },
    {
      icon: '💬',
      title: 'Hỗ trợ 24/7',
      description: 'Chat support, email, hotline và knowledge base đầy đủ bằng tiếng Việt.',
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              AutoPost VN
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="text-blue-600 font-medium border-b-2 border-blue-600">Tính năng</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Bảng giá</Link>
              <Link href="/support" className="text-gray-600 hover:text-blue-600">Trợ giúp</Link>
              <Link href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Đăng nhập</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Tính năng 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Mạnh mẽ
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AutoPost VN mang đến giải pháp tự động hóa marketing trên mạng xã hội toàn diện, 
            giúp doanh nghiệp tiết kiệm thời gian và tối ưu hiệu quả.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium">
              Dùng thử miễn phí
            </Link>
            <Link href="/pricing" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-medium">
              Xem bảng giá
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-md' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                  {feature.highlight && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Hot
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Sẵn sàng tự động hóa marketing?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng AutoPost VN
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app" className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium">
              Bắt đầu miễn phí
            </Link>
            <Link href="/support" className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 font-medium">
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AutoPost VN</h3>
              <p className="text-gray-400">
                Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
              <div className="space-y-2">
                <Link href="/features" className="block text-gray-400 hover:text-white">Tính năng</Link>
                <Link href="/pricing" className="block text-gray-400 hover:text-white">Bảng giá</Link>
                <Link href="/support" className="block text-gray-400 hover:text-white">Trợ giúp</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pháp lý</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-400 hover:text-white">Điều khoản sử dụng</Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white">Chính sách bảo mật</Link>
                <Link href="/cookies" className="block text-gray-400 hover:text-white">Chính sách Cookie</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 cuong.vhcc@gmail.com</p>
                <p>📱 0987 939 605</p>
                <p>📍 Tầng 05, Tòa nhà A2, CSkyView, Thủ dầu một, TP.HCM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AutoPost VN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
