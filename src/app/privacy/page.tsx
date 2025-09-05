import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật - AutoPost VN',
  description: 'Chính sách bảo mật và quyền riêng tư của AutoPost VN. Cam kết bảo vệ thông tin cá nhân người dùng.',
}

export default function PrivacyPage() {
  const lastUpdated = "01/01/2025"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
              Chính sách bảo mật
            </h1>
            <p className="text-gray-600">
              Cập nhật lần cuối: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Cam kết bảo mật */}
            <section className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
                🔒 Cam kết bảo mật
              </h2>
              <p className="text-green-700">
                AutoPost VN cam kết bảo vệ thông tin cá nhân của bạn với các tiêu chuẩn bảo mật 
                cao nhất. Chúng tôi tuân thủ GDPR và các quy định bảo mật dữ liệu của Việt Nam.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Thông tin chúng tôi thu thập</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Thông tin cá nhân</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Họ tên, email</li>
                    <li>• Số điện thoại</li>
                    <li>• Ảnh đại diện</li>
                    <li>• Thông tin thanh toán</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Dữ liệu sử dụng</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Lịch sử đăng bài</li>
                    <li>• Analytics và metrics</li>
                    <li>• Thiết bị và IP</li>
                    <li>• Cookies và session</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Mục đích sử dụng dữ liệu</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cung cấp dịch vụ</h3>
                    <p className="text-gray-700">Tạo tài khoản, xác thực, đăng bài tự động</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phân tích và cải thiện</h3>
                    <p className="text-gray-700">Tối ưu hóa hiệu suất, phát triển tính năng mới</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bảo mật và an toàn</h3>
                    <p className="text-gray-700">Ngăn chặn gian lận, bảo vệ hệ thống</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Liên lạc</h3>
                    <p className="text-gray-700">Thông báo dịch vụ, hỗ trợ khách hàng</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Bảo vệ dữ liệu</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">🔐</div>
                  <h3 className="font-semibold mb-2">Mã hóa SSL/TLS</h3>
                  <p className="text-sm text-gray-600">Tất cả dữ liệu được mã hóa khi truyền tải</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">🏛️</div>
                  <h3 className="font-semibold mb-2">Server bảo mật</h3>
                  <p className="text-sm text-gray-600">Lưu trữ trên cloud có chứng nhận ISO 27001</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="font-semibold mb-2">Kiểm soát truy cập</h3>
                  <p className="text-sm text-gray-600">Chỉ nhân viên được ủy quyền mới truy cập</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Chia sẻ dữ liệu</h2>
              <p className="text-gray-700 mb-4">
                Chúng tôi <strong>KHÔNG bán</strong> thông tin cá nhân. Dữ liệu chỉ được chia sẻ trong các trường hợp:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Đối tác dịch vụ (Facebook, Instagram, Zalo) để thực hiện đăng bài</li>
                <li>Nhà cung cấp thanh toán để xử lý giao dịch</li>
                <li>Yêu cầu pháp lý từ cơ quan chức năng</li>
                <li>Bảo vệ quyền lợi và an toàn của AutoPost VN</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Quyền của người dùng</h2>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-3">Theo GDPR, bạn có quyền:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-yellow-700">✓ Truy cập dữ liệu</p>
                    <p className="text-yellow-600">Xem thông tin chúng tôi lưu trữ</p>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-700">✓ Chỉnh sửa dữ liệu</p>
                    <p className="text-yellow-600">Cập nhật thông tin cá nhân</p>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-700">✓ Xóa dữ liệu</p>
                    <p className="text-yellow-600">Yêu cầu xóa tài khoản</p>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-700">✓ Chuyển đổi dữ liệu</p>
                    <p className="text-yellow-600">Xuất dữ liệu sang định dạng khác</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies và tracking</h2>
              <p className="text-gray-700 mb-4">
                Chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng:
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Cookies thiết yếu</span>
                  <span className="text-green-600 text-sm">Luôn bật</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Cookies phân tích</span>
                  <span className="text-blue-600 text-sm">Có thể tắt</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Cookies marketing</span>
                  <span className="text-orange-600 text-sm">Có thể tắt</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Thời gian lưu trữ</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Dữ liệu tài khoản: Cho đến khi bạn xóa tài khoản</li>
                <li>Lịch sử đăng bài: 2 năm</li>
                <li>Analytics: 1 năm</li>
                <li>Logs hệ thống: 6 tháng</li>
              </ul>
            </section>

            <section className="bg-red-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-red-800 mb-4">8. Báo cáo vi phạm bảo mật</h2>
              <p className="text-red-700 mb-3">
                Nếu phát hiện vi phạm bảo mật, chúng tôi sẽ:
              </p>
              <ul className="list-disc pl-6 text-red-700 space-y-1">
                <li>Thông báo cho người dùng trong 72 giờ</li>
                <li>Báo cáo cho cơ quan chức năng</li>
                <li>Thực hiện biện pháp khắc phục ngay lập tức</li>
              </ul>
            </section>

            <section className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Liên hệ về bảo mật</h3>
              <div className="text-gray-700 space-y-1">
                <p>🔒 DPO (Data Protection Officer): cuong.vhcc@gmail.com</p>
                <p>📱 Hotline bảo mật: 0987 939 605</p>
                <p>📍 Tầng 12, Tòa nhà FPT, 17 Duy Tân, Cầu Giấy, Hà Nội</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Điều khoản sử dụng
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
