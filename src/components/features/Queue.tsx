'use client';

import { useState } from 'react';
import { PROVIDERS } from '@/lib/constants';
import type { Post } from '@/types/Post';
import { Eye, X, Image as ImageIcon, Video, Calendar, Clock, Send, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

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
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-base font-semibold">Hàng đợi</div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {posts.length}
        </span>
      </div>
      <div className="divide-y">
        {paginatedPosts.map(post => {
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
              
              {/* Preview Button */}
              <button
                onClick={() => setPreviewPost(post)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>
              
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <p className="text-xs text-gray-500">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedPosts.length)} / {sortedPosts.length} bài
          </p>
          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Show first, last, current, and adjacent pages
              const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              const showEllipsis = page === 2 && currentPage > 3 || page === totalPages - 1 && currentPage < totalPages - 2;
              
              if (showEllipsis && !showPage) {
                return <span key={page} className="px-1 text-gray-400">...</span>;
              }
              
              if (!showPage && !showEllipsis) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[28px] h-7 px-2 text-xs rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>

    {/* Preview Modal */}
    {previewPost && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setPreviewPost(null)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Chi tiết bài đăng</h3>
            <button 
              onClick={() => setPreviewPost(null)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            {/* Title */}
            <h4 className="font-bold text-lg text-gray-900 mb-3">{previewPost.title}</h4>

            {/* Content */}
            {previewPost.content && (
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {previewPost.content}
                </p>
              </div>
            )}

            {/* Media Preview */}
            {previewPost.mediaUrls && previewPost.mediaUrls.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  {previewPost.mediaUrls.some(m => m.includes('video')) ? (
                    <><Video className="w-4 h-4" /> Video đính kèm</>
                  ) : (
                    <><ImageIcon className="w-4 h-4" /> {previewPost.mediaUrls.length} ảnh đính kèm</>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {previewPost.mediaUrls.slice(0, 6).map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {url.includes('video') ? (
                        <video src={url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                {previewPost.mediaUrls.length > 6 && (
                  <p className="text-xs text-gray-500 mt-1">+{previewPost.mediaUrls.length - 6} thêm</p>
                )}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Schedule Time */}
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-[10px] text-blue-600 font-medium">Lịch đăng</p>
                  <p className="text-xs text-gray-700">
                    {new Date(previewPost.datetime).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-[10px] text-gray-600 font-medium">Trạng thái</p>
                  <p className="text-xs text-gray-700">{getStatusBadge(previewPost).text}</p>
                </div>
              </div>

              {/* Platforms */}
              <div className="col-span-2 flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <Send className="w-4 h-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-[10px] text-purple-600 font-medium mb-1">Nền tảng</p>
                  <div className="flex flex-wrap gap-1">
                    {previewPost.providers.map(provider => (
                      <span
                        key={provider}
                        className={`rounded-md px-2 py-0.5 text-xs ${
                          PROVIDERS[provider as keyof typeof PROVIDERS]?.chip || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {PROVIDERS[provider as keyof typeof PROVIDERS]?.tag || provider.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
            <button
              onClick={() => setPreviewPost(null)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
