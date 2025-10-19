'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DataDeletionStatusContent() {
  const searchParams = useSearchParams();
  const confirmationId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Yêu cầu xóa dữ liệu đã được ghi nhận
          </h1>
          <p className="text-gray-600">
            Data Deletion Request Confirmed
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Mã xác nhận:</strong>{' '}
                <code className="bg-white px-2 py-1 rounded text-blue-900">
                  {confirmationId || 'N/A'}
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Điều gì sẽ xảy ra tiếp theo?
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                1
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Xác nhận yêu cầu</h3>
                <p className="text-gray-600 text-sm">
                  Chúng tôi đã nhận được yêu cầu xóa dữ liệu của bạn từ Facebook.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                2
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Xử lý xóa dữ liệu</h3>
                <p className="text-gray-600 text-sm">
                  Tất cả dữ liệu liên quan đến tài khoản Facebook của bạn sẽ được xóa trong vòng 30 ngày.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                3
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Hoàn tất</h3>
                <p className="text-gray-600 text-sm">
                  Bạn sẽ nhận được email xác nhận khi quá trình xóa dữ liệu hoàn tất.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Dữ liệu sẽ được xóa bao gồm:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Thông tin tài khoản kết nối Facebook
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Bài đăng đã lên lịch
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Nội dung đã tạo
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Access tokens và thông tin xác thực
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Logs và dữ liệu hoạt động
            </li>
          </ul>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-gray-500 text-center">
            Nếu bạn có câu hỏi về quyền riêng tư và xóa dữ liệu, vui lòng xem{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Chính sách Bảo mật
            </a>
            {' '}hoặc liên hệ{' '}
            <a href="mailto:support@autopostvn.com" className="text-blue-600 hover:text-blue-800 underline">
              support@autopostvn.com
            </a>
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Quay về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <DataDeletionStatusContent />
    </Suspense>
  );
}
