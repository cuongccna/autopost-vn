'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Grid3x3, List, Image as ImageIcon, Video, Calendar, Tag, Download, Loader2, Trash2, Play, Eye, AlertTriangle } from 'lucide-react';

interface MediaItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  media_type: 'image' | 'video';
  public_url: string;
  status: string;
  tags: string[];
  created_at: string;
  metadata?: any;
  file_path: string;
  bucket: string;
}

interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem[]) => void;
  maxSelect?: number;
  mediaType?: 'image' | 'video' | 'all';
  selectedIds?: string[];
}

export default function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  maxSelect = 10,
  mediaType = 'all',
  selectedIds = [],
}: MediaLibraryPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  
  // Preview & Delete states
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, mediaType, filterStatus]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mediaType !== 'all') params.append('mediaType', mediaType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('limit', '100');

      const response = await fetch(`/api/media?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.items ?? data.media ?? []);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.file_name.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleToggleSelect = (item: MediaItem) => {
    const isSelected = selectedMedia.some(m => m.id === item.id);
    
    if (isSelected) {
      setSelectedMedia(selectedMedia.filter(m => m.id !== item.id));
    } else {
      if (selectedMedia.length < maxSelect) {
        setSelectedMedia([...selectedMedia, item]);
      }
    }
  };

  const handleConfirm = () => {
    onSelect(selectedMedia);
    onClose();
    setSelectedMedia([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handle delete media
  const handleDeleteMedia = async (item: MediaItem) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/media?id=${item.id}&permanent=true`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setMedia(prev => prev.filter(m => m.id !== item.id));
        setSelectedMedia(prev => prev.filter(m => m.id !== item.id));
        setDeleteItem(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Không thể xóa media');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa media');
    } finally {
      setDeleting(false);
    }
  };

  // Handle preview
  const handlePreview = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewItem(item);
  };

  // Handle delete button click
  const handleDeleteClick = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItem(item);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Thư viện Media</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedMedia.length > 0 && `Đã chọn ${selectedMedia.length}/${maxSelect}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b bg-gray-50 space-y-4">
            {/* Search & View Mode */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên file hoặc tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="uploaded">Đã upload</option>
                <option value="published">Đã đăng</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>

          {/* Media Grid/List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Không có media nào</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMedia.map((item) => {
                  const isSelected = selectedMedia.some(m => m.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Preview */}
                      <div
                        className="aspect-square bg-gray-100 relative"
                        onClick={() => handleToggleSelect(item)}
                      >
                        {item.media_type === 'image' ? (
                          <img
                            src={item.public_url}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full relative bg-gray-900">
                            {/* Video thumbnail with play icon */}
                            <video
                              src={item.public_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-12 h-12 text-white opacity-80" fill="white" />
                            </div>
                          </div>
                        )}
                        
                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 rounded text-xs text-white">
                          {item.media_type === 'image' ? '🖼️' : '🎬'}
                        </div>

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handlePreview(item, e)}
                            className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
                            title="Xem trước"
                          >
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(item, e)}
                            className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-700 truncate">{item.file_name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(item.file_size)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map((item) => {
                  const isSelected = selectedMedia.some(m => m.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Checkbox */}
                      <div 
                        onClick={() => handleToggleSelect(item)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>

                      {/* Thumbnail */}
                      <div 
                        className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative group"
                        onClick={() => handleToggleSelect(item)}
                      >
                        {item.media_type === 'image' ? (
                          <img src={item.public_url} alt={item.file_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full relative bg-gray-900">
                            <video
                              src={item.public_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0" onClick={() => handleToggleSelect(item)}>
                        <p className="font-medium text-gray-900 truncate">{item.file_name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{item.media_type === 'image' ? '🖼️ Ảnh' : '🎬 Video'}</span>
                          <span>{formatFileSize(item.file_size)}</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => handlePreview(item, e)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(item, e)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Tổng: {filteredMedia.length} media
              {selectedMedia.length > 0 && ` • Đã chọn: ${selectedMedia.length}`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedMedia.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Chọn ({selectedMedia.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Media Content */}
            <div className="bg-black rounded-lg overflow-hidden">
              {previewItem.media_type === 'image' ? (
                <img 
                  src={previewItem.public_url} 
                  alt={previewItem.file_name}
                  className="max-w-full max-h-[80vh] mx-auto object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={previewItem.public_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* File Info */}
            <div className="mt-4 text-center text-white">
              <p className="font-medium">{previewItem.file_name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {previewItem.media_type === 'image' ? '🖼️ Ảnh' : '🎬 Video'} • {formatFileSize(previewItem.file_size)} • {formatDate(previewItem.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
          onClick={() => !deleting && setDeleteItem(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa media?</h3>
              <p className="text-gray-600">
                Bạn có chắc muốn xóa <span className="font-medium text-gray-900">{deleteItem.file_name}</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Hành động này sẽ xóa vĩnh viễn file khỏi server và không thể khôi phục!
              </p>
            </div>

            {/* Preview */}
            <div className="px-6 pb-4">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {deleteItem.media_type === 'image' ? (
                    <img src={deleteItem.public_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Play className="w-5 h-5 text-white" fill="white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{deleteItem.file_name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(deleteItem.file_size)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t">
              <button
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
                className="flex-1 py-4 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteMedia(deleteItem)}
                disabled={deleting}
                className="flex-1 py-4 bg-red-600 text-white hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa vĩnh viễn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
