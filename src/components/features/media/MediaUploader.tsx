'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MediaUploaderProps {
  workspaceId?: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export default function MediaUploader({ workspaceId, onClose, onUploadComplete }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    setUploading(true);

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
        ));

        // Get user session
        const response = await fetch('/api/auth/session');
        if (!response.ok) throw new Error('Not authenticated');
        
        const session = await response.json();
        const userId = session?.user?.id;
        if (!userId) throw new Error('User ID not found');

        // Generate unique file path
        const fileExt = uploadFile.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, uploadFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        // Simulate progress (Supabase doesn't support onUploadProgress)
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, progress: 100 } : f
        ));

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Save to database
        const mediaType = uploadFile.file.type.startsWith('video/') ? 'video' : 'image';
        
        const { error: dbError } = await supabase
          .from('autopostvn_media')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            file_name: uploadFile.file.name,
            file_type: uploadFile.file.type,
            file_size: uploadFile.file.size,
            storage_path: filePath,
            public_url: urlData.publicUrl,
            media_type: mediaType,
            status: 'uploaded'
          });

        if (dbError) throw dbError;

        // Update status to success
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ));
      }
    }

    setUploading(false);
    
    // Check if all uploads completed successfully
    const allSuccess = files.every(f => f.status === 'success' || f.status === 'error');
    if (allSuccess) {
      onUploadComplete();
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600';
      case 'uploading': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploading':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Upload Media</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop Zone */}
          {files.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg text-gray-600 mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500">Supports images and videos up to 100MB</p>
            </div>
          ) : (
            <>
              {/* File List */}
              <div className="space-y-3 mb-4">
                {files.map((uploadFile) => (
                  <div key={uploadFile.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {uploadFile.preview ? (
                          <img src={uploadFile.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {uploadFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadFile.file.size)}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 ml-4 ${getStatusColor(uploadFile.status)}`}>
                            {getStatusIcon(uploadFile.status)}
                            <span className="text-sm font-medium capitalize">{uploadFile.status}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {uploadFile.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            ></div>
                          </div>
                        )}

                        {/* Error Message */}
                        {uploadFile.status === 'error' && uploadFile.error && (
                          <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                        )}
                      </div>

                      {/* Remove Button */}
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              {!uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Add More Files
                </button>
              )}
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Footer */}
        {files.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              {files.filter(f => f.status === 'success').length} / {files.length} files uploaded
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                disabled={uploading || files.every(f => f.status !== 'pending')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload {files.filter(f => f.status === 'pending').length} Files
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
