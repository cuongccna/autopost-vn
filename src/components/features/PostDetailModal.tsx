'use client';

import { useState } from 'react';
import { PROVIDERS } from '@/lib/constants';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface Post {
  id: string;
  title: string;
  datetime: string;
  providers: string[];
  status: 'scheduled' | 'published' | 'failed';
  content?: string;
  error?: string;
  mediaUrls?: string[];
}

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (_post: Post) => void;
  onDelete?: (_postId: string) => void;
  onReschedule?: (_postId: string, _newDateTime: string) => void;
}

export default function PostDetailModal({ 
  post, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onReschedule 
}: PostDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDateTime, setNewDateTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !post) return null;

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Đã lên lịch', color: 'bg-blue-100 text-blue-800', icon: '⏰' };
      case 'published':
        return { label: 'Đã đăng', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'failed':
        return { label: 'Thất bại', color: 'bg-red-100 text-red-800', icon: '❌' };
      default:
        return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  const statusInfo = getStatusInfo(post.status);
  const { date, time } = formatDateTime(post.datetime);

  const handleReschedule = () => {
    if (newDateTime && onReschedule) {
      onReschedule(post.id, newDateTime);
      setIsEditing(false);
      setNewDateTime('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold">Chi tiết bài đăng</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Time */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">{date}</div>
              <div className="text-lg font-semibold text-gray-900">{time}</div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
            <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-lg p-3">
              {post.title}
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
              <div className="bg-gray-50 rounded-lg p-3 whitespace-pre-wrap text-gray-900">
                {post.content}
              </div>
            </div>
          )}

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh ({post.mediaUrls.length})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {post.mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100"
                        title="Xem ảnh lớn"
                      >
                        🔍
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Providers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nền tảng đăng ({post.providers.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {post.providers.map(provider => {
                const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS];
                return (
                  <div
                    key={provider}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      providerInfo?.chip || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {providerInfo?.label || provider}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error message if failed */}
          {post.status === 'failed' && post.error && (
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">Lỗi</label>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                {post.error}
              </div>
            </div>
          )}

          {/* Reschedule section */}
          {post.status === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thay đổi thời gian
              </label>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📅 Lên lịch lại
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleReschedule}
                    disabled={!newDateTime}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewDateTime('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            {onEdit && post.status === 'scheduled' && (
              <button
                onClick={() => {
                  onEdit(post);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✏️ Chỉnh sửa
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Xóa
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa bài đăng"
        message="Bạn có chắc chắn muốn xóa bài đăng này?"
        confirmText="OK"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          if (onDelete) {
            onDelete(post.id);
            onClose();
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      </div>
    </div>
  );
}
