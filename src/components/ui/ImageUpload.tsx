'use client';

import React, { useState, useRef, useCallback } from 'react';
import { uploadImage, deleteImage } from '@/lib/supabase/storage';

interface UploadedImage {
  id: string;
  file: File;
  publicUrl: string;
  path: string;
  uploading: boolean;
  error?: string;
}

interface ImageUploadProps {
  userId: string;
  maxImages?: number;
  onImagesChange?: (_images: UploadedImage[]) => void;
  className?: string;
}

export default function ImageUpload({ 
  userId, 
  maxImages = 4, 
  onImagesChange,
  className = '' 
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection or drop
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    // Add files to state with uploading status
    const newImages: UploadedImage[] = filesToProcess.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      publicUrl: '',
      path: '',
      uploading: true
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange?.(updatedImages);

    // Upload each file
    for (let i = 0; i < newImages.length; i++) {
      const imageIndex = images.length + i;
      const file = newImages[i].file;

      try {
        const result = await uploadImage(file, userId);
        
        if (result.success) {
          // Update the image with successful upload data
          setImages(prev => {
            const updated = prev.map((img, idx) => 
              idx === imageIndex 
                ? { 
                    ...img, 
                    publicUrl: result.publicUrl!,
                    path: result.path!,
                    uploading: false 
                  }
                : img
            );
            onImagesChange?.(updated);
            return updated;
          });
        } else {
          // Update with error
          setImages(prev => {
            const updated = prev.map((img, idx) => 
              idx === imageIndex 
                ? { 
                    ...img, 
                    uploading: false,
                    error: result.error 
                  }
                : img
            );
            onImagesChange?.(updated);
            return updated;
          });
        }
      } catch (error) {
        // Handle unexpected errors
        setImages(prev => {
          const updated = prev.map((img, idx) => 
            idx === imageIndex 
              ? { 
                  ...img, 
                  uploading: false,
                  error: 'Lỗi không xác định khi upload' 
                }
              : img
          );
          onImagesChange?.(updated);
          return updated;
        });
      }
    }
  };

  // Handle drag events
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

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Remove image
  const removeImage = async (index: number) => {
    const image = images[index];
    
    // Delete from storage if uploaded
    if (image.path && !image.uploading) {
      await deleteImage(image.path);
    }

    // Remove from state
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  // Trigger file input
  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  const remainingSlots = maxImages - images.length;
  const canAddMore = remainingSlots > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileInput}
          className={`
            relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${dragActive 
              ? 'border-blue-400 bg-blue-50 text-blue-600' 
              : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100'
            }
          `}
        >
          <div className="space-y-2">
            <div className="text-3xl">📸</div>
            <div className="text-sm font-medium">
              Kéo‑thả ảnh vào đây, hỗ trợ PNG/JPG
            </div>
            <div className="text-xs text-gray-500">
              (Tối đa {maxImages} ảnh • Còn lại: {remainingSlots})
            </div>
            <div className="text-xs text-gray-400">
              hoặc click để chọn file
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
            >
              {/* Loading State */}
              {image.uploading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-500 text-sm">Đang tải...</div>
                </div>
              )}

              {/* Error State */}
              {image.error && (
                <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-2">
                  <div className="text-red-500 text-xs text-center mb-2">
                    {image.error}
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Xóa
                  </button>
                </div>
              )}

              {/* Successful Upload */}
              {!image.uploading && !image.error && image.publicUrl && (
                <>
                  <img
                    src={image.publicUrl}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => removeImage(index)}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}

              {/* Fallback for preview */}
              {!image.uploading && !image.error && !image.publicUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(image.file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Info */}
      {images.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          {images.filter(img => !img.uploading && !img.error).length} / {maxImages} ảnh đã tải lên
          {images.some(img => img.uploading) && ' • Đang tải...'}
          {images.some(img => img.error) && ' • Có lỗi xảy ra'}
        </div>
      )}
    </div>
  );
}
