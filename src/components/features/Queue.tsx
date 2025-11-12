'use client';

import { PROVIDERS } from '@/lib/constants';
import type { Post } from '@/types/Post';

function getStatusBadge(post: Post) {
  const now = new Date();
  const scheduledTime = new Date(post.datetime);
  
  if (post.status === 'published') {
    return { 
      icon: '✅', 
      text: 'Đã đăng', 
      color: 'bg-green-50 text-green-700 border-green-200' 
    };
  } else if (post.status === 'failed') {
    return { 
      icon: '❌', 
      text: 'Thất bại', 
      color: 'bg-red-50 text-red-700 border-red-200' 
    };
  } else if (scheduledTime > now) {
    return { 
      icon: '⏰', 
      text: 'Chờ đăng', 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200' 
    };
  } else {
    return { 
      icon: '⏳', 
      text: 'Đang xử lý', 
      color: 'bg-blue-50 text-blue-700 border-blue-200' 
    };
  }
}

function getTimeIndicator(post: Post) {
  const now = new Date();
  const time = new Date(post.datetime);
  const diffMs = time.getTime() - now.getTime();
  const diffMins = Math.floor(Math.abs(diffMs) / 60000);
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
  
  if (post.status === 'published') {
    if (diffMins < 60) {
      return `Đã đăng ${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `Đã đăng ${diffHours} giờ trước`;
    } else {
      return `Đã đăng ${diffDays} ngày trước`;
    }
  } else {
    if (diffMs < 0) {
      return 'Đang xử lý...';
    } else if (diffMins < 60) {
      return `Sẽ đăng sau ${diffMins} phút`;
    } else if (diffHours < 24) {
      return `Sẽ đăng sau ${diffHours} giờ`;
    } else {
      return `Sẽ đăng sau ${diffDays} ngày`;
    }
  }
}

export default function Queue({ posts }: { posts: Post[] }) {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-base font-semibold">Hàng đợi</div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {posts.length}
        </span>
      </div>
      <div className="divide-y">
        {sortedPosts.map(post => {
          const badge = getStatusBadge(post);
          const timeText = getTimeIndicator(post);
          
          return (
            <div key={post.id} className="flex items-start justify-between py-3 gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{post.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>
                    {new Date(post.datetime).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit', 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span className="text-gray-600 font-medium">{timeText}</span>
                  <span>•</span>
                  <span className="flex gap-1">
                    {post.providers.map(provider => (
                      <span
                        key={provider}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          PROVIDERS[provider as keyof typeof PROVIDERS]?.chip || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {PROVIDERS[provider as keyof typeof PROVIDERS]?.tag || provider.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
              <span className={`flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium ${badge.color}`}>
                <span className="mr-1">{badge.icon}</span>
                {badge.text}
              </span>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Chưa có bài đăng nào trong hàng đợi
          </div>
        )}
      </div>
    </section>
  );
}
