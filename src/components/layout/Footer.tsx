import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">AutoPost VN</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Nền tảng tự động hóa đăng bài lên mạng xã hội hàng đầu Việt Nam. 
              Giúp doanh nghiệp và cá nhân quản lý nội dung hiệu quả.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-400">Liên hệ</h4>
              <div className="space-y-1 text-gray-300">
                <p>📧 Email: cuong.vhcc@gmail.com</p>
                <p>📱 Điện thoại: 0987 939 605</p>
                <p>🏢 Địa chỉ: Tầng 05, Tòa nhà A2, CSkyView, Thủ dầu một, TP.HCM</p>
                <p>🕒 Thời gian làm việc: 8:00 - 17:30 (Thứ 2 - Thứ 6)</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-blue-400 mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-400 transition-colors">
                  Tính năng
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                  Bảng giá
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-blue-400 transition-colors">
                  Trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="hover:text-blue-400 transition-colors">
                  Đăng nhập
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-blue-400 mb-4">Pháp lý</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-blue-400 transition-colors">
                  Chính sách Cookie
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} AutoPost VN. Tất cả quyền được bảo lưu.
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="https://facebook.com/autopostvn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            
            <a 
              href="https://zalo.me/autopostvn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <span className="sr-only">Zalo</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 2.19.71 4.22 1.92 5.86L2 22l4.14-1.96c1.64 1.21 3.67 1.92 5.86 1.92 5.5 0 9.96-4.46 9.96-9.96S17.5 2.04 12 2.04zm4.64 7.56l-2.4 2.4c-.32.32-.84.32-1.16 0L12 10.92 10.92 12c-.32.32-.84.32-1.16 0L7.36 9.6c-.32-.32-.32-.84 0-1.16.32-.32.84-.32 1.16 0L12 10.92l3.48-2.48c.32-.32.84-.32 1.16 0 .32.32.32.84 0 1.16z"/>
              </svg>
            </a>
            
            <a 
              href="mailto:cuong.vhcc@gmail.com"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <span className="sr-only">Email</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
