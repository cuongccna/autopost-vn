import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chính sách Cookie - AutoPost VN',
  description: 'Chính sách sử dụng cookie của AutoPost VN. Thông tin về cách chúng tôi sử dụng cookies.',
}

export default function CookiesPage() {
  const lastUpdated = "01/01/2025"

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
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
              🍪 Chính sách Cookie
            </h1>
            <p className="text-gray-600">
              Cập nhật lần cuối: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Overview */}
            <section className="bg-orange-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-orange-800 mb-4">
                Cookie là gì?
              </h2>
              <p className="text-orange-700">
                Cookies là những file nhỏ được lưu trữ trên thiết bị của bạn khi truy cập website. 
                Chúng giúp chúng tôi cải thiện trải nghiệm người dùng, ghi nhớ thông tin đăng nhập 
                và phân tích cách sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Loại cookies chúng tôi sử dụng</h2>
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">
                    🔧 Cookies thiết yếu (Bắt buộc)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Những cookies cần thiết để website hoạt động bình thường. Không thể tắt.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ví dụ:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      <li><code>session_token</code> - Quản lý phiên đăng nhập</li>
                      <li><code>csrf_token</code> - Bảo vệ khỏi tấn công CSRF</li>
                      <li><code>auth_state</code> - Xác thực người dùng</li>
                      <li><code>language_preference</code> - Ghi nhớ ngôn ngữ</li>
                    </ul>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">
                    📊 Cookies phân tích (Tùy chọn)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Giúp chúng tôi hiểu cách người dùng tương tác với website để cải thiện dịch vụ.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ví dụ:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      <li><code>_ga</code> - Google Analytics (2 năm)</li>
                      <li><code>_ga_*</code> - Google Analytics GA4 (2 năm)</li>
                      <li><code>user_interactions</code> - Theo dõi tương tác (1 năm)</li>
                      <li><code>page_views</code> - Đếm lượt xem trang (6 tháng)</li>
                    </ul>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold text-purple-800 mb-3">
                    📱 Cookies marketing (Tùy chọn)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Được sử dụng để hiển thị quảng cáo phù hợp và đo lường hiệu quả campaign.
                  </p>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ví dụ:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      <li><code>_fbp</code> - Facebook Pixel (3 tháng)</li>
                      <li><code>_gcl_au</code> - Google Ads (3 tháng)</li>
                      <li><code>utm_source</code> - Nguồn traffic (30 ngày)</li>
                      <li><code>referrer_data</code> - Dữ liệu giới thiệu (30 ngày)</li>
                    </ul>
                  </div>
                </div>

                {/* Preferences Cookies */}
                <div className="border-l-4 border-yellow-500 pl-6">
                  <h3 className="text-xl font-semibold text-yellow-800 mb-3">
                    ⚙️ Cookies tùy chỉnh (Tùy chọn)
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Ghi nhớ các thiết lập và lựa chọn của bạn để cá nhân hóa trải nghiệm.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ví dụ:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      <li><code>theme_preference</code> - Dark/Light mode</li>
                      <li><code>dashboard_layout</code> - Bố cục dashboard</li>
                      <li><code>timezone</code> - Múi giờ người dùng</li>
                      <li><code>notification_settings</code> - Cài đặt thông báo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Thời gian lưu trữ cookies</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Loại Cookie</th>
                      <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                      <th className="px-4 py-3 text-left font-semibold">Mục đích</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-t">
                      <td className="px-4 py-3">Session Cookies</td>
                      <td className="px-4 py-3">Khi đóng trình duyệt</td>
                      <td className="px-4 py-3">Quản lý phiên đăng nhập</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Persistent Cookies</td>
                      <td className="px-4 py-3">30 ngày - 2 năm</td>
                      <td className="px-4 py-3">Ghi nhớ thiết lập</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Analytics Cookies</td>
                      <td className="px-4 py-3">1-2 năm</td>
                      <td className="px-4 py-3">Phân tích hành vi</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Marketing Cookies</td>
                      <td className="px-4 py-3">3-12 tháng</td>
                      <td className="px-4 py-3">Quảng cáo và tracking</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cách quản lý cookies</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">🔧 Qua cài đặt AutoPost VN</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Bạn có thể điều chỉnh cookies trong phần Cài đặt → Quyền riêng tư
                  </p>
                  <Link 
                    href="/app/settings/privacy" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Quản lý Cookies
                  </Link>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">🌐 Qua trình duyệt</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Bạn có thể tắt cookies hoặc xóa cookies hiện có qua cài đặt trình duyệt
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Chrome: Settings → Privacy → Cookies</p>
                    <p>• Firefox: Options → Privacy → Cookies</p>
                    <p>• Safari: Preferences → Privacy</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Tác động khi tắt cookies</h2>
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-3">⚠️ Lưu ý quan trọng</h3>
                <ul className="list-disc pl-6 text-red-700 space-y-2">
                  <li>Tắt cookies thiết yếu sẽ khiến website không hoạt động bình thường</li>
                  <li>Bạn sẽ phải đăng nhập lại mỗi lần truy cập</li>
                  <li>Mất các thiết lập cá nhân hóa</li>
                  <li>Một số tính năng có thể không khả dụng</li>
                  <li>Quảng cáo có thể không phù hợp với sở thích</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies của bên thứ ba</h2>
              <p className="text-gray-700 mb-4">
                AutoPost VN sử dụng các dịch vụ bên thứ ba có thể đặt cookies riêng:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-blue-800">Google Analytics</h4>
                  <p className="text-xs text-blue-600 mt-2">Phân tích lưu lượng truy cập</p>
                  <Link 
                    href="https://policies.google.com/privacy" 
                    className="text-blue-600 text-xs underline mt-1 inline-block"
                    target="_blank"
                  >
                    Chính sách Google
                  </Link>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-blue-800">Facebook Pixel</h4>
                  <p className="text-xs text-blue-600 mt-2">Theo dõi conversion</p>
                  <Link 
                    href="https://www.facebook.com/privacy/policy/" 
                    className="text-blue-600 text-xs underline mt-1 inline-block"
                    target="_blank"
                  >
                    Chính sách Facebook
                  </Link>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-blue-800">Hotjar</h4>
                  <p className="text-xs text-blue-600 mt-2">Heat mapping & recording</p>
                  <Link 
                    href="https://www.hotjar.com/legal/policies/privacy/" 
                    className="text-blue-600 text-xs underline mt-1 inline-block"
                    target="_blank"
                  >
                    Chính sách Hotjar
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookie consent</h2>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">✅ Sự đồng ý của bạn</h3>
                <p className="text-green-700 mb-3">
                  Khi lần đầu truy cập AutoPost VN, bạn sẽ thấy thông báo về cookies. 
                  Bạn có thể:
                </p>
                <ul className="list-disc pl-6 text-green-700 space-y-1">
                  <li>Chấp nhận tất cả cookies</li>
                  <li>Chỉ chấp nhận cookies thiết yếu</li>
                  <li>Tùy chỉnh từng loại cookies</li>
                  <li>Thay đổi lựa chọn bất cứ lúc nào</li>
                </ul>
              </div>
            </section>

            <section className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Liên hệ về cookies</h3>
              <div className="text-gray-700 space-y-1">
                <p>🍪 Câu hỏi về cookies: cuong.vhcc@gmail.com</p>
                <p>📱 Hỗ trợ: 0987 939 605</p>
                <p>📍 Tầng 12, Tòa nhà FPT, 17 Duy Tân, Cầu Giấy, Hà Nội</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Chính sách bảo mật
            </Link>
            <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
              Điều khoản sử dụng →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
