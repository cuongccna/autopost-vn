import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trợ giúp - AutoPost VN',
  description: 'Nhận hỗ trợ nhanh chóng qua Zalo, email, hotline. Tìm câu trả lời trong knowledge base và liên hệ team support.',
}

export default function SupportPage() {
  const supportChannels = [
    {
      icon: '💬',
      title: 'Chat Zalo',
      description: 'Nhắn tin trực tiếp, phản hồi nhanh nhất',
      action: 'Chat ngay',
      link: 'https://zalo.me/0987939605',
      highlight: true,
      time: 'Phản hồi trong 5 phút'
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Gửi email cho các vấn đề phức tạp',
      action: 'Gửi email',
      link: 'mailto:cuong.vhcc@gmail.com',
      highlight: false,
      time: 'Phản hồi trong 2 giờ'
    },
    {
      icon: '📱',
      title: 'Hotline',
      description: 'Gọi điện trực tiếp để được tư vấn',
      action: 'Gọi ngay',
      link: 'tel:0987939605',
      highlight: false,
      time: '8:00 - 17:30 (T2-T6)'
    },
    {
      icon: '📍',
      title: 'Tới văn phòng',
      description: 'Ghé thăm văn phòng để tư vấn trực tiếp',
      action: 'Xem địa chỉ',
      link: 'https://maps.google.com/?q=Tầng+05+Tòa+nhà+A2+CSkyView+Thủ+Dầu+Một+TP.HCM',
      highlight: false,
      time: 'Cần đặt lịch trước'
    }
  ]

  const quickHelp = [
    {
      category: 'Bắt đầu',
      items: [
        'Cách đăng ký tài khoản',
        'Kết nối Facebook Page',
        'Kết nối Instagram Business',
        'Kết nối Zalo OA'
      ]
    },
    {
      category: 'Đăng bài',
      items: [
        'Tạo bài đăng mới',
        'Lên lịch đăng bài',
        'Sử dụng AI Content Generator',
        'Upload và quản lý media'
      ]
    },
    {
      category: 'Analytics',
      items: [
        'Xem báo cáo hiệu suất',
        'Export báo cáo PDF',
        'Hiểu các metrics',
        'So sánh hiệu suất platforms'
      ]
    },
    {
      category: 'Tài khoản',
      items: [
        'Nâng cấp gói dịch vụ',
        'Quản lý thanh toán',
        'Thêm thành viên team',
        'Cài đặt bảo mật'
      ]
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
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Tính năng</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Bảng giá</Link>
              <Link href="/support" className="text-blue-600 font-medium border-b-2 border-blue-600">Trợ giúp</Link>
              <Link href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Đăng nhập</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Chúng tôi luôn sẵn sàng 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}hỗ trợ bạn
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Nhận hỗ trợ nhanh chóng qua nhiều kênh khác nhau. Team support Việt Nam sẵn sàng giúp đỡ 24/7.
          </p>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Chọn cách liên hệ phù hợp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  channel.highlight 
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-md' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-4xl mb-4">{channel.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {channel.title}
                  {channel.highlight && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      Nhanh nhất
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 mb-4">{channel.description}</p>
                <p className="text-sm text-blue-600 mb-4 font-medium">{channel.time}</p>
                <a 
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-all ${
                    channel.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {channel.action}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Help */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Trợ giúp nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickHelp.map((category, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Gửi yêu cầu hỗ trợ
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại yêu cầu
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Hỗ trợ kỹ thuật</option>
                  <option>Tư vấn dịch vụ</option>
                  <option>Báo lỗi</option>
                  <option>Góp ý tính năng</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung chi tiết *
                </label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu của bạn..."
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-all"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Thông tin liên hệ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-blue-100">cuong.vhcc@gmail.com</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold mb-2">Hotline</h3>
              <p className="text-blue-100">0987 939 605</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📍</div>
              <h3 className="font-semibold mb-2">Địa chỉ</h3>
              <p className="text-blue-100">Tầng 05, Tòa nhà A2, CSkyView<br />Thủ Dầu Một, TP.HCM</p>
            </div>
          </div>
          <div className="mt-8 text-blue-100">
            <p>⏰ Thời gian làm việc: 8:00 - 17:30 (Thứ 2 - Thứ 6)</p>
          </div>
        </div>
      </section>
    </div>
  )
}
