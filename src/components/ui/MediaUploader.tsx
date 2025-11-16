'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/utils/toast';

export interface UploadedMedia {
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  bucket: string;
  mediaType: 'image' | 'video';
  preview?: string; // Local preview URL
}

interface MediaUploaderProps {
  onMediaChange: (media: UploadedMedia[]) => void;
  value?: UploadedMedia[]; // Controlled mode
  maxFiles?: number;
  acceptImages?: boolean;
  acceptVideos?: boolean;
  className?: string;
}

export default function MediaUploader({
  onMediaChange,
  value,
  maxFiles = 10,
  acceptImages = true,
  acceptVideos = true,
  className = ''
}: MediaUploaderProps) {
  // Use controlled mode if value is provided, otherwise use internal state
  const [internalMedia, setInternalMedia] = useState<UploadedMedia[]>([]);
  const media = value !== undefined ? value : internalMedia;
  const setMedia = (newMedia: UploadedMedia[]) => {
    if (value === undefined) {
      setInternalMedia(newMedia);
    }
    onMediaChange(newMedia);
  };
  
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptTypes = [
    ...(acceptImages ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] : []),
    ...(acceptVideos ? ['video/mp4', 'video/quicktime', 'video/x-msvideo'] : [])
  ].join(',');

  const handleFiles = useCallback(async (files: FileList) => {
    if (media.length + files.length > maxFiles) {
      showToast.error(`Tối đa ${maxFiles} file`);
      return;
    }

    // Check for mixed media types
    const currentHasVideo = media.some(m => m.mediaType === 'video');
    const currentHasImage = media.some(m => m.mediaType === 'image');
    
    const newFiles = Array.from(files);
    const newHasVideo = newFiles.some(f => f.type.startsWith('video/'));
    const newHasImage = newFiles.some(f => f.type.startsWith('image/'));

    if ((currentHasVideo && newHasImage) || (currentHasImage && newHasVideo)) {
      showToast.error('Không thể upload cả video và hình ảnh cùng lúc. Facebook chỉ hỗ trợ 1 loại media.');
      return;
    }

    setUploading(true);
    const newMedia: UploadedMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        showToast.error(`${file.name}: Định dạng không hỗ trợ`);
        continue;
      }

      if (!acceptImages && isImage) {
        showToast.error('Không hỗ trợ upload ảnh');
        continue;
      }

      if (!acceptVideos && isVideo) {
        showToast.error('Không hỗ trợ upload video');
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      try {
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();

        newMedia.push({
          ...data.file,
          preview: previewUrl,
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        showToast.error(`${file.name}: ${error.message}`);
        URL.revokeObjectURL(previewUrl);
      }
    }

    const updatedMedia = [...media, ...newMedia];
    setMedia(updatedMedia);
    onMediaChange(updatedMedia);
    setUploading(false);

  }, [media, maxFiles, acceptImages, acceptVideos, onMediaChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleRemove = async (index: number) => {
    const item = media[index];

    // Delete from server
    try {
      await fetch(`/api/media/upload?bucket=${item.bucket}&path=${item.path}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete error:', error);
    }

    // Revoke preview URL
    if (item.preview) {
      URL.revokeObjectURL(item.preview);
    }

    const updatedMedia = media.filter((_, i) => i !== index);
    setMedia(updatedMedia);
    onMediaChange(updatedMedia);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptTypes}
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        <p className="text-gray-600 mb-2">
          Kéo thả file vào đây hoặc{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:underline font-medium"
          >
            chọn file
          </button>
        </p>
        
        <p className="text-sm text-gray-500">
          {acceptImages && acceptVideos && 'Hỗ trợ: Ảnh (JPG, PNG, GIF) và Video (MP4, MOV)'}
          {acceptImages && !acceptVideos && 'Hỗ trợ: Ảnh (JPG, PNG, GIF, WEBP)'}
          {!acceptImages && acceptVideos && 'Hỗ trợ: Video (MP4, MOV, AVI)'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tối đa {maxFiles} file • Ảnh: 10MB • Video: 100MB
        </p>
      </div>

      {/* Uploading Indicator */}
      {uploading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đang upload...</span>
        </div>
      )}

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {item.mediaType === 'image' ? (
                  <img
                    src={item.preview || item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Video className="w-12 h-12 text-white" />
                    <video
                      src={item.preview || item.url}
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      muted
                    />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>

              {/* File Info */}
              <div className="mt-2">
                <p className="text-xs text-gray-600 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  {(item.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
