'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  onImagesChange?: (images: UploadedImage[]) => void;
  className?: string;
  initialImages?: UploadedImage[]; // Re-add for proper initialization
}

export default function ImageUpload({ 
  userId, 
  maxImages = 4, 
  onImagesChange,
  className = '',
  initialImages = []
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generate stable ID for file input
  const [inputId] = useState(() => `real-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Update images when initialImages changes (for editing mode)
  useEffect(() => {
    if (initialImages.length > 0 && images.length === 0) {
      console.log('📤 Setting initial images:', initialImages.length);
      setImages(initialImages);
      onImagesChange?.(initialImages);
    }
  }, [initialImages, images.length, onImagesChange]);
  
  // Debug: Check file input ref on mount
  useEffect(() => {
    console.log('📤 ImageUpload mounted, inputId:', inputId);
    console.log('📤 fileInputRef on mount:', fileInputRef.current);
    
    const timer = setTimeout(() => {
      console.log('📤 fileInputRef after timeout:', fileInputRef.current);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [inputId]);

  // Handle file selection or drop
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const successfulUploads = images.filter(img => !img.uploading && !img.error).length;
    const remainingSlots = maxImages - successfulUploads;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      console.log('📤 No slots available for new images');
      return;
    }

    console.log('📤 Adding new images to existing list. Current:', images.length, 'New:', filesToProcess.length);

    // Add files to existing images (append, don't replace)
    const newImages: UploadedImage[] = filesToProcess.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      publicUrl: '',
      path: '',
      uploading: true
    }));

    const updatedImages = [...images, ...newImages]; // Append to existing
    setImages(updatedImages);
    onImagesChange?.(updatedImages);

    // Upload each file
    for (let i = 0; i < newImages.length; i++) {
      const tempImage = newImages[i];
      const file = tempImage.file;

      try {
        const result = await uploadImage(file, userId);
        
        if (result.success) {
          // Update the specific image by ID in the full list
          setImages(prev => {
            const updated = prev.map(img => 
              img.id === tempImage.id 
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
          console.log('✅ Image uploaded successfully:', result.publicUrl);
        } else {
          // Update with error by ID
          setImages(prev => {
            const updated = prev.map(img => 
              img.id === tempImage.id 
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
          console.error('❌ Image upload failed:', result.error);
        }
      } catch (error) {
        // Handle unexpected errors by ID
        setImages(prev => {
          const updated = prev.map(img => 
            img.id === tempImage.id 
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
        console.error('❌ Unexpected upload error:', error);
      }
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 ImageUpload drag event:', e.type);
    
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
    console.log('📤 ImageUpload file input changed');
    if (e.target.files && e.target.files.length > 0) {
      console.log('📤 Files selected:', e.target.files.length);
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

  const remainingSlots = maxImages - images.filter(img => !img.uploading && !img.error).length;
  const canAddMore = remainingSlots > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div className="relative">
          {/* Visual container */}
          <div
            className={`
              rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
              transition-all duration-200 ease-in-out pointer-events-none
              ${dragActive 
                ? 'border-blue-400 bg-blue-50 text-blue-600' 
                : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100'
              }
            `}
            data-upload-area="real-upload"
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
          </div>
          
          {/* File input overlay - this will handle all clicks */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleInputChange}
            onClick={(e) => {
              console.log('📤 File input directly clicked!', e.type);
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            data-component="real-upload-input"
            id={inputId}
            title="Click to select images"
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
          {images.filter(img => !img.uploading && !img.error).length} / {maxImages} ảnh đã tải lên thành công
          {images.some(img => img.uploading) && ' • Đang tải...'}
          {images.some(img => img.error) && ' • Có lỗi xảy ra'}
        </div>
      )}
    </div>
  );
}
