'use client';

import { useMemo } from 'react';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
  error?: string;
}

interface ErrorAnalyticsProps {
  posts: Post[];
}

export default function ErrorAnalytics({ posts }: ErrorAnalyticsProps) {
  const errorData = useMemo(() => {
    const failed = posts.filter(p => p.status === 'failed');
    const total = posts.length;
    const failureRate = total > 0 ? (failed.length / total) * 100 : 0;
    
    // Common error categories
    const errorCategories = {
      'network': { 
        name: 'Lỗi mạng', 
        count: 0, 
        color: 'bg-red-500',
        keywords: ['network', 'timeout', 'connection', 'mạng', 'kết nối']
      },
      'auth': { 
        name: 'Lỗi xác thực', 
        count: 0, 
        color: 'bg-orange-500',
        keywords: ['auth', 'token', 'login', 'permission', 'xác thực', 'quyền']
      },
      'content': { 
        name: 'Lỗi nội dung', 
        count: 0, 
        color: 'bg-yellow-500',
        keywords: ['content', 'format', 'size', 'type', 'nội dung', 'định dạng']
      },
      'limit': { 
        name: 'Vượt giới hạn', 
        count: 0, 
        color: 'bg-purple-500',
        keywords: ['limit', 'rate', 'quota', 'giới hạn', 'quá mức']
      },
      'unknown': { 
        name: 'Lỗi khác', 
        count: 0, 
        color: 'bg-gray-500',
        keywords: []
      }
    };

    // Categorize errors
    failed.forEach(post => {
      const error = (post.error || '').toLowerCase();
      let categorized = false;
      
      for (const [key, category] of Object.entries(errorCategories)) {
        if (key !== 'unknown' && category.keywords.some(keyword => error.includes(keyword))) {
          category.count++;
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        errorCategories.unknown.count++;
      }
    });

    // Provider-specific failure rates
    const providerErrors = ['facebook', 'instagram', 'zalo'].map(provider => {
      const providerPosts = posts.filter(p => p.providers.includes(provider));
      const providerFailed = providerPosts.filter(p => p.status === 'failed');
      return {
        provider,
        name: provider === 'facebook' ? 'Facebook' : provider === 'instagram' ? 'Instagram' : 'Zalo',
        total: providerPosts.length,
        failed: providerFailed.length,
        rate: providerPosts.length > 0 ? (providerFailed.length / providerPosts.length) * 100 : 0,
        color: provider === 'facebook' ? 'from-blue-500 to-blue-600' : 
               provider === 'instagram' ? 'from-purple-500 to-pink-500' : 
               'from-blue-600 to-indigo-600'
      };
    });

    // Recent failures for troubleshooting
    const recentFailures = failed
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      .slice(0, 5);

    return {
      total,
      failed: failed.length,
      failureRate,
      errorCategories: Object.entries(errorCategories).map(([key, data]) => ({ key, ...data })),
      providerErrors,
      recentFailures
    };
  }, [posts]);

  const getErrorIcon = (category: string) => {
    switch (category) {
      case 'network': return '🌐';
      case 'auth': return '🔐';
      case 'content': return '📝';
      case 'limit': return '⚠️';
      default: return '❓';
    }
  };

  const getTimeAgo = (datetime: string) => {
    const now = new Date();
    const date = new Date(datetime);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Phân tích lỗi</h3>
        <p className="text-sm text-gray-600">Chi tiết các lỗi xảy ra và thống kê failure rate</p>
      </div>

      {/* Overall failure rate */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-red-600 font-medium">Tỷ lệ lỗi tổng thể</div>
            <div className="text-3xl font-bold text-red-700">{errorData.failureRate.toFixed(1)}%</div>
            <div className="text-sm text-red-600">{errorData.failed}/{errorData.total} bài đăng</div>
          </div>
          <div className="text-4xl">
            {errorData.failureRate < 5 ? '✅' : errorData.failureRate < 15 ? '⚠️' : '❌'}
          </div>
        </div>
      </div>

      {/* Error categories */}
      {errorData.failed > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Phân loại lỗi</h4>
          <div className="space-y-3">
            {errorData.errorCategories
              .filter(category => category.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((category) => (
                <div key={category.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getErrorIcon(category.key)}</div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.count} trường hợp</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-semibold">{((category.count / errorData.failed) * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">của tổng lỗi</div>
                    </div>
                    <div className="w-3 h-8 rounded-full bg-gray-200">
                      <div 
                        className={`${category.color} rounded-full`}
                        style={{ 
                          height: `${(category.count / errorData.failed) * 100}%`,
                          minHeight: category.count > 0 ? '8px' : '0'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Provider-specific error rates */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Tỷ lệ lỗi theo nền tảng</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {errorData.providerErrors.map((provider) => (
            <div key={provider.provider} className={`bg-gradient-to-r ${provider.color} rounded-xl p-4 text-white`}>
              <div className="text-sm opacity-90">{provider.name}</div>
              <div className="text-2xl font-bold">{provider.rate.toFixed(1)}%</div>
              <div className="text-sm opacity-90">{provider.failed}/{provider.total} bài</div>
              <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(provider.rate, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent failures */}
      {errorData.recentFailures.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Lỗi gần đây</h4>
          <div className="space-y-2">
            {errorData.recentFailures.map((post) => (
              <div key={post.id} className="flex items-start justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-red-900 line-clamp-1">{post.title}</div>
                  <div className="text-sm text-red-700 mt-1 line-clamp-2">
                    {post.error || 'Không có thông tin lỗi chi tiết'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {post.providers.map(provider => (
                      <span key={provider} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">
                        {provider === 'facebook' ? 'FB' : provider === 'instagram' ? 'IG' : 'Zalo'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-red-600 text-sm ml-4">
                  {getTimeAgo(post.datetime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {errorData.failed === 0 && errorData.total > 0 && (
        <div className="text-center py-8 text-green-600">
          <div className="text-4xl mb-2">🎉</div>
          <div className="font-medium">Tuyệt vời! Không có lỗi nào</div>
          <div className="text-sm mt-1 text-gray-600">Tất cả {errorData.total} bài đăng đều thành công</div>
        </div>
      )}

      {errorData.total === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div>Chưa có dữ liệu phân tích</div>
          <div className="text-sm mt-1">Đăng một số bài để xem thống kê lỗi</div>
        </div>
      )}

      {/* Tips */}
      {errorData.failed > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">💡 Gợi ý khắc phục:</div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kiểm tra kết nối mạng và thử lại sau vài phút</li>
              <li>• Đảm bảo token truy cập các nền tảng còn hiệu lực</li>
              <li>• Kiểm tra kích thước và định dạng nội dung</li>
              <li>• Tránh đăng quá nhiều bài trong thời gian ngắn</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
