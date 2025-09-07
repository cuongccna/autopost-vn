'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ScheduledPost {
  id: string;
  post_id: string;
  scheduled_at: string;
  status: string;
  retry_count: number;
  error_message?: string;
  external_post_id?: string;
  social_account: {
    name: string;
    provider: string;
  };
  post: {
    title: string;
    content: string;
  };
}

interface SchedulerResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  details: Array<{
    scheduleId: string;
    postId: string;
    status: 'success' | 'failed' | 'skipped';
    message: string;
  }>;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  publishing: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const providerIcons = {
  facebook: '📘',
  instagram: '📷',
  zalo: '💬'
};

export default function SchedulerMonitor() {
  const { data: session } = useSession();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SchedulerResult | null>(null);

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/schedules');
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test scheduler
  const testScheduler = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/test/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 5 })
      });

      const result = await response.json();
      setTestResult(result);
      
      // Refresh scheduled posts after test
      setTimeout(() => {
        fetchScheduledPosts();
      }, 1000);

    } catch (error) {
      console.error('Error testing scheduler:', error);
      setTestResult({
        processed: 0,
        successful: 0,
        failed: 1,
        skipped: 0,
        details: [{
          scheduleId: 'error',
          postId: 'error',
          status: 'failed',
          message: 'Failed to test scheduler: ' + String(error)
        }]
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchScheduledPosts();
    }
  }, [session]);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  const getTimeUntil = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return 'Quá hạn';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày ${hours % 24} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };

  if (!session) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">Vui lòng đăng nhập để xem scheduler monitor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            🤖 Scheduler Monitor & Test
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchScheduledPosts}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Đang tải...' : '🔄 Refresh'}
            </button>
            <button
              onClick={testScheduler}
              disabled={testing}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {testing ? '⏳ Đang test...' : '🚀 Test Scheduler'}
            </button>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">📊 Kết quả test:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{testResult.processed}</div>
                <div className="text-sm text-gray-600">Đã xử lý</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testResult.successful}</div>
                <div className="text-sm text-gray-600">Thành công</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{testResult.failed}</div>
                <div className="text-sm text-gray-600">Thất bại</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{testResult.skipped}</div>
                <div className="text-sm text-gray-600">Bỏ qua</div>
              </div>
            </div>
            
            {testResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Chi tiết:</h4>
                {testResult.details.map((detail, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      detail.status === 'success' ? 'bg-green-500' :
                      detail.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    {detail.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Scheduler sẽ kiểm tra và đăng các bài đã lên lịch tự động. 
          Click &quot;Test Scheduler&quot; để chạy thử hoặc &quot;Refresh&quot; để cập nhật danh sách.
        </p>
      </div>

      {/* Scheduled posts list */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">
            📅 Bài đăng đã lên lịch ({scheduledPosts.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : scheduledPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-3xl mb-2">📭</div>
            <p>Chưa có bài đăng nào được lên lịch</p>
          </div>
        ) : (
          <div className="divide-y">
            {scheduledPosts.map((schedule) => (
              <div key={schedule.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">
                    {providerIcons[schedule.social_account.provider as keyof typeof providerIcons] || '📱'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {schedule.post.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[schedule.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {schedule.post.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📱 {schedule.social_account.name}</span>
                      <span>⏰ {formatDateTime(schedule.scheduled_at)}</span>
                      {schedule.status === 'pending' && (
                        <span className="text-blue-600">
                          🕒 Còn {getTimeUntil(schedule.scheduled_at)}
                        </span>
                      )}
                      {schedule.retry_count > 0 && (
                        <span className="text-orange-600">
                          🔄 Retry {schedule.retry_count}/3
                        </span>
                      )}
                    </div>
                    
                    {schedule.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ❌ {schedule.error_message}
                      </div>
                    )}
                    
                    {schedule.external_post_id && (
                      <div className="mt-2 text-xs text-green-600">
                        ✅ Đã đăng: {schedule.external_post_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
