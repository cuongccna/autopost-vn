'use client';

import { useState } from 'react';
import { MediaItem, MediaType, MediaStatus } from '@/lib/services/media-lifecycle.service';

interface MediaPreviewModalProps {
  media: MediaItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export default function MediaPreviewModal({ media, onClose, onDelete, onUpdate }: MediaPreviewModalProps) {
  const [tags, setTags] = useState<string[]>(media.tags || []);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;

    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');

    await saveTags(updatedTags);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    await saveTags(updatedTags);
  };

  const saveTags = async (updatedTags: string[]) => {
    try {
      setSaving(true);
      const response = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          tags: updatedTags
        })
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Save tags error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = media.public_url;
    a.download = media.file_name;
    a.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(media.public_url);
    alert('URL copied to clipboard!');
  };

  const platformIcons: Record<string, string> = {
    facebook: '📘',
    instagram: '📸',
    tiktok: '🎵',
    zalo: '💬'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Media Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {media.media_type === MediaType.IMAGE ? (
                  <img
                    src={media.public_url}
                    alt={media.file_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={media.public_url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy URL
                </button>
                <button
                  onClick={() => onDelete(media.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* File Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{media.file_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">{media.media_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium text-gray-900">{formatFileSize(media.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{media.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(media.created_at).toLocaleString()}
                    </span>
                  </div>
                  {media.published_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Published:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(media.published_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform URLs */}
              {media.platform_urls && Object.keys(media.platform_urls).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Published On</h3>
                  <div className="space-y-2">
                    {Object.entries(media.platform_urls).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">{platformIcons[platform] || '🌐'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 capitalize">{platform}</div>
                          <div className="text-xs text-gray-600 truncate">{url}</div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement */}
              {media.engagement_score > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Engagement</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (media.engagement_score / 10000) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {media.engagement_score.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
