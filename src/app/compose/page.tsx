'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ComposeLeftPanel from '@/components/features/compose/ComposeLeftPanel';
import ComposeCenterPanel from '@/components/features/compose/ComposeCenterPanel';
import ComposeRightPanel from '@/components/features/compose/ComposeRightPanel';
import { useToast } from '@/components/ui/Toast';
import { usePostRateLimit } from '@/hooks/usePostRateLimit';
import { activityLogger } from '@/lib/services/activityLogger';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ComposeData {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  postId?: string;
  metadata?: {
    type?: 'social' | 'video';
    platform: string;
    ratio: string;
    hashtags?: string;
    cta?: string;
    brandColor?: string;
    template?: string;
    duration?: number;
    hook?: string;
    beats?: { time: number; text: string; }[];
    sub?: string;
    overlayCTA?: string;
  };
}

export default function ComposePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  
  // Shared state between panels
  const [activeTab, setActiveTab] = useState<'social' | 'video'>('social');
  const [composeData, setComposeData] = useState<Partial<ComposeData>>({
    title: '',
    content: '',
    channels: ['facebook', 'instagram'],
    scheduleAt: '',
    mediaUrls: [],
    metadata: {
      type: 'social',
      platform: 'Facebook Page',
      ratio: '1:1',
      hashtags: '',
      cta: 'Mua ngay',
      brandColor: '#0ea5e9',
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Rate limit hook
  const { 
    rateLimitData, 
    checkRateLimit, 
    canCreatePost, 
    getBlockedReason, 
    getRateLimitMessage 
  } = usePostRateLimit();
  
  // Debug logs
  console.log('📄 ComposePage - rateLimitData:', rateLimitData);
  console.log('📄 ComposePage - getRateLimitMessage:', getRateLimitMessage);

  // Check authentication
  useEffect(() => {
    // 🚨 EMERGENCY: Disable rate limit check to prevent infinite loop
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    let mounted = true;
    
    // Check rate limit on page load with delay to prevent rapid calls
    const timer = setTimeout(() => {
      if (mounted) {
        checkRateLimit();
      }
    }, 1000); // 1 second delay
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [session, status, router]); // Removed checkRateLimit dependency to prevent loop

  // Handle form submission
  const handleSubmit = async (data: ComposeData) => {
    if (isSubmitting) return;
    const startTime = Date.now();
    const isEditing = !!editingPostId;
    
    // Store original data for comparison in case of update
    const originalData = isEditing ? { ...composeData } : null;
    
    // Validate required fields
    if (!data.content?.trim()) {
      showToast({ message: 'Vui lòng nhập nội dung bài viết', type: 'error' });
      return;
    }
    
    if (!data.channels?.length) {
      showToast({ message: 'Vui lòng chọn ít nhất một kênh đăng', type: 'error' });
      return;
    }

    // Check rate limit for new posts
    if (!editingPostId && !canCreatePost()) {
      const reason = getBlockedReason();
      showToast({ message: reason, type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
      const method = editingPostId ? 'PUT' : 'POST';

      // Map frontend field names to backend field names
      const requestBody = {
        title: data.content?.substring(0, 100) || 'Untitled', // Create title from content
        content: data.content,
        providers: data.channels, // Map channels to providers
        scheduled_at: data.scheduleAt && data.scheduleAt !== new Date().toISOString() ? data.scheduleAt : null, // Map scheduleAt to scheduled_at
        media_urls: data.mediaUrls || [],
        metadata: data.metadata || {}
      };

      console.log('📤 [COMPOSE] Sending request:', {
        endpoint,
        method,
        body: requestBody
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi lưu bài viết');
      }

      const result = await response.json();
      
      // Log successful activity
      if (isEditing && originalData) {
        await activityLogger.logPostUpdated(originalData, data, editingPostId);
      } else {
        if (data.scheduleAt) {
          await activityLogger.logPostScheduled(data, data.scheduleAt, result.post?.id);
        } else {
          await activityLogger.logPostCreated(data, result.post?.id);
        }
      }
      
      // Store result for modal
      setSubmissionResult(result);
      setShowSuccessModal(true);
      
      // Show detailed success message
      showToast({
        title: editingPostId ? 'Cập nhật thành công!' : 'Đăng bài thành công!',
        message: `Bài viết "${data.title || 'Không có tiêu đề'}" đã được ${editingPostId ? 'cập nhật' : 'tạo'} thành công. ${result.post?.channels?.length || data.channels.length} kênh sẽ được đăng.`,
        type: 'success',
        duration: 8000 // Show longer
      });
      
    } catch (error) {
      console.error('Error submitting post:', error);
      
      // Log failed activity
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu bài viết';
      await activityLogger.logPostFailed(data, errorMessage, editingPostId || undefined);
      
      showToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/close
  const handleCancel = () => {
    // Check if user has unsaved changes
    const hasChanges = composeData.title || composeData.content || composeData.mediaUrls?.length;
    
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      router.push('/dashboard');
    }
  };

  // Confirm cancel action
  const confirmCancel = () => {
    router.push('/dashboard');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Minimalist Top Bar */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              ← Quay lại
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeTab === 'video' ? '🎥 Tạo Video/Reel' : '📱 Tạo Bài Viết'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User info - simple, no dropdown */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
              </div>
              <span className="hidden sm:block">
                {session.user?.name || session.user?.email}
              </span>
            </div>
          </div>
        </div>      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Dashboard
              </button>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 text-sm font-medium">
              {editingPostId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingPostId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Tạo nội dung hấp dẫn cho các nền tảng mạng xã hội
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            
            <button
              onClick={() => handleSubmit(composeData as ComposeData)}
              disabled={isSubmitting || (!editingPostId && !canCreatePost())}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isSubmitting || (!editingPostId && !canCreatePost())
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingPostId ? 'Đang cập nhật...' : 'Đang đăng bài...'}
                </>
              ) : (
                editingPostId ? 'Cập nhật bài viết' : 'Đăng bài ngay'
              )}
            </button>
          </div>
        </div>

        {/* Rate Limit Warning */}
        {rateLimitData && !rateLimitData.allowed && !editingPostId && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Đã đạt giới hạn tạo bài viết
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {getRateLimitMessage(rateLimitData)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Tools & Templates */}
          <div className="lg:col-span-3">
            <ComposeLeftPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              composeData={composeData}
              onDataChange={setComposeData}
            />
          </div>

          {/* Center Panel - Editor & Preview */}
          <div className="lg:col-span-6">
            <ComposeCenterPanel
              activeTab={activeTab}
              composeData={composeData}
              onDataChange={setComposeData}
              showToast={showToast}
            />
          </div>

          {/* Right Panel - Scheduling & Channels */}
          <div className="lg:col-span-3">
            <ComposeRightPanel
              composeData={composeData}
              onDataChange={setComposeData}
              rateLimitData={rateLimitData}
              getRateLimitMessage={getRateLimitMessage}
            />
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && submissionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {editingPostId ? 'Cập nhật thành công!' : 'Đăng bài thành công!'}
              </h3>
              
              <div className="text-sm text-gray-600 mb-4 space-y-2">
                <p><strong>Tiêu đề:</strong> {submissionResult.post?.title || composeData.title || 'Không có tiêu đề'}</p>
                <p><strong>Số kênh:</strong> {submissionResult.post?.channels?.length || composeData.channels?.length || 0} kênh</p>
                <p><strong>Trạng thái:</strong> {submissionResult.post?.status === 'scheduled' ? 'Đã lên lịch' : 'Đã đăng'}</p>
                {submissionResult.post?.schedule_at && (
                  <p><strong>Thời gian đăng:</strong> {new Date(submissionResult.post.schedule_at).toLocaleString('vi-VN')}</p>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Về Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSubmissionResult(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Tiếp tục tạo bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Hủy tạo bài viết"
        message="Bạn có chắc muốn hủy? Những thay đổi chưa lưu sẽ bị mất."
        confirmText="Hủy bài viết"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </div>
  );
}
