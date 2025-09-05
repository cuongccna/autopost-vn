import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng - AutoPost VN',
  description: 'Điều khoản và điều kiện sử dụng dịch vụ AutoPost VN. Quy định về quyền và nghĩa vụ của người dùng.',
}

export default function TermsPage() {
  const lastUpdated = "01/01/2025"

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
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Tính năng</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Bảng giá</Link>
              <Link href="/support" className="text-gray-600 hover:text-blue-600">Trợ giúp</Link>
              <Link href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Đăng nhập</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Điều khoản sử dụng
            </h1>
            <p className="text-gray-600">
              Cập nhật lần cuối: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Terms sections here */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Chấp nhận điều khoản</h2>
              <p className="text-gray-700">
                Bằng việc truy cập và sử dụng dịch vụ AutoPost VN, bạn đồng ý tuân thủ và bị ràng buộc bởi 
                các điều khoản và điều kiện được nêu trong tài liệu này.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dịch vụ AutoPost VN</h2>
              <p className="text-gray-700 mb-4">
                AutoPost VN cung cấp nền tảng tự động hóa marketing trên mạng xã hội với các tính năng:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Tự động đăng bài lên Facebook, Instagram, Zalo OA</li>
                <li>AI Content Generator với Gemini AI</li>
                <li>Analytics và báo cáo hiệu suất</li>
                <li>Quản lý team và collaboration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Nghĩa vụ người dùng</h2>
              <p className="text-gray-700 mb-4">Người dùng cam kết:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Cung cấp thông tin chính xác khi đăng ký</li>
                <li>Bảo mật thông tin đăng nhập</li>
                <li>Tuân thủ pháp luật Việt Nam</li>
                <li>Không vi phạm quyền sở hữu trí tuệ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Hành vi bị cấm</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Đăng nội dung vi phạm pháp luật</li>
                <li>Spam hoặc gửi tin nhắn rác</li>
                <li>Hack hoặc phá hoại hệ thống</li>
                <li>Chia sẻ tài khoản trái phép</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Thanh toán</h2>
              <p className="text-gray-700">
                Dịch vụ có gói miễn phí và trả phí. Chính sách hoàn tiền 30 ngày cho khách hàng mới.
                Giá có thể thay đổi với thông báo trước 30 ngày.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Giới hạn trách nhiệm</h2>
              <p className="text-gray-700">
                AutoPost VN không chịu trách nhiệm về thiệt hại gián tiếp, mất mát dữ liệu do 
                bên thứ ba hoặc sử dụng sai mục đích.
              </p>
            </section>

            <section className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Liên hệ</h3>
              <div className="text-gray-700 space-y-1">
                <p>📧 cuong.vhcc@gmail.com</p>
                <p>📱 0987 939 605</p>
                <p>📍 Tầng 05, Tòa nhà A2, CSkyView, Thủ dầu một, TP.HCM</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Chính sách bảo mật
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:text-blue-800 font-medium">
              Chính sách Cookie →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
