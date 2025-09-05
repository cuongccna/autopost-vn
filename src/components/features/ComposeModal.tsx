'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PROVIDERS } from '@/lib/constants';
import ImageUpload from '@/components/ui/ImageUpload';
import ContentEditor from '@/components/ui/ContentEditor';
import TemplateLibrary from '@/components/ui/TemplateLibrary';

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

interface UploadedImage {
  id: string;
  file: File;
  publicUrl: string;
  path: string;
  uploading: boolean;
  error?: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (_data: {
    content: string;
    channels: string[];
    scheduleAt: string;
    mediaUrls: string[];
    postId?: string; // For editing existing posts
  }) => void;
  goldenHours?: string[];
  defaultDateTime?: Date | null;
  editingPost?: Post | null;
}

const goldenHours = ['09:00', '12:30', '20:00'];

export default function ComposeModal({ isOpen, onClose, onSubmit, goldenHours: customGoldenHours, defaultDateTime, editingPost }: ComposeModalProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(['fb', 'ig']));
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  
  const hours = customGoldenHours || goldenHours;

  // Auto-fill datetime when defaultDateTime is provided
  useEffect(() => {
    if (defaultDateTime) {
      // Set time to current time + 1 hour
      const targetDate = new Date(defaultDateTime);
      const now = new Date();
      targetDate.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
      
      // Format for datetime-local input
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;
      setScheduleAt(formatted);
    }
  }, [defaultDateTime]);

  // Auto-fill data when editing a post
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      
      // Convert providers from API format to UI format
      const providerMapping: { [key: string]: string } = {
        'facebook': 'fb',
        'instagram': 'ig',
        'zalo': 'zalo'
      };
      
      const uiProviders = editingPost.providers.map(p => providerMapping[p] || p);
      setSelectedChannels(new Set(uiProviders));
      
      // Format datetime for input
      if (editingPost.datetime) {
        const date = new Date(editingPost.datetime);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        setScheduleAt(formatted);
      }
      
      // Set existing images if any
      if (editingPost.mediaUrls && editingPost.mediaUrls.length > 0) {
        const existingImages = editingPost.mediaUrls.map((url, index) => ({
          id: `existing-${index}`,
          file: new File([], `existing-image-${index}`), // Dummy file
          publicUrl: url,
          path: url,
          uploading: false
        }));
        setUploadedImages(existingImages);
      }
    }
  }, [editingPost]);

  const toggleChannel = (channel: string) => {
    const newChannels = new Set(selectedChannels);
    if (newChannels.has(channel)) {
      newChannels.delete(channel);
    } else {
      newChannels.add(channel);
    }
    setSelectedChannels(newChannels);
  };

  const setGoldenHour = (hour: string) => {
    const [h, m] = hour.split(':').map(Number);
    const date = new Date(scheduleAt || Date.now());
    date.setHours(h, m, 0, 0);
    
    // Format for datetime-local input
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    setScheduleAt(formatted);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    // Get URLs of successfully uploaded images
    const mediaUrls = uploadedImages
      .filter(img => !img.uploading && !img.error && img.publicUrl)
      .map(img => img.publicUrl);
    
    onSubmit({
      content: content.trim(),
      channels: Array.from(selectedChannels),
      scheduleAt: scheduleAt || new Date().toISOString(),
      mediaUrls,
      postId: editingPost?.id, // Include postId when editing
    });
    
    // Reset form
    setContent('');
    setScheduleAt('');
    setSelectedChannels(new Set(['fb', 'ig']));
    setUploadedImages([]);
    onClose();
  };

  const handleSelectTemplate = (template: { content: string }) => {
    setContent(template.content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {editingPost ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng'}
          </h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100" 
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Nội dung</label>
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                📚 Chọn template
              </button>
            </div>
            
            <ContentEditor
              value={content}
              onChange={setContent}
              placeholder="Viết nội dung bài đăng của bạn... Hoặc chọn template có sẵn"
              maxLength={2000}
            />
            
            {/* Image Upload Component */}
            {session?.user && (
              <ImageUpload
                userId={(session.user as any).id || 'demo-user'}
                maxImages={4}
                onImagesChange={setUploadedImages}
                className="mt-3"
              />
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium">Kênh đăng</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROVIDERS).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => toggleChannel(key)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selectedChannels.has(key)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <div className="mb-2 text-sm font-medium">Thời gian đăng</div>
              <input 
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {hours.map(hour => (
                  <button
                    key={hour}
                    onClick={() => setGoldenHour(hour)}
                    className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200 hover:bg-yellow-100"
                  >
                    Giờ vàng: {hour}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Lên lịch bài đăng
            </button>
          </div>
        </div>
      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <TemplateLibrary
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}
    </div>
  );
}
