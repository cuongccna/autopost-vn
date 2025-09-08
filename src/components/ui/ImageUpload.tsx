'use client';

import React, { useState, useRef } from 'react';

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
  initialImages?: UploadedImage[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  userId,
  maxImages = 4,
  onImagesChange,
  className = '',
  initialImages = []
}) => {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    // Show error message since storage is disabled
    alert('Image upload is temporarily disabled - storage bucket was removed from database');
    return;
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  const remainingSlots = maxImages - images.length;
  const canAddMore = remainingSlots > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload area */}
      {canAddMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-gray-600">
            <p className="text-sm">Kéo thả hoặc click để chọn ảnh</p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF tối đa 5MB ({remainingSlots} slot còn lại)
            </p>
            <p className="text-xs text-red-400 mt-2">
              ⚠️ Tính năng upload tạm thời bị vô hiệu hóa
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {image.error ? (
                  <div className="w-full h-full flex items-center justify-center text-red-500 text-xs p-2">
                    <span>{image.error}</span>
                  </div>
                ) : image.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <img
                    src={image.publicUrl || URL.createObjectURL(image.file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;