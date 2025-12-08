'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ComposeLeftPanel from '@/components/features/compose/ComposeLeftPanel';
import ComposeCenterPanel from '@/components/features/compose/ComposeCenterPanel';
import ComposeRightPanel from '@/components/features/compose/ComposeRightPanel';
import { useToast } from '@/components/ui/Toast';
import { usePostRateLimit } from '@/hooks/usePostRateLimit';
import { activityLogger } from '@/lib/services/activityLogger';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { mapProvidersToAPI } from '@/lib/constants';

interface ComposeData {
  title: string;
  content: string;
  channels: string[];
  scheduleAt: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video' | 'album' | 'none';
  postId?: string;
  aiContext?: string;
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

type ComposeDataKeys = keyof ComposeData;

const isShallowEqual = (a?: Record<string, any>, b?: Record<string, any>) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};

const areArraysEqual = (a?: any[], b?: any[]) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

function ComposePageContent() {
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
    aiContext: '',
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
  const handleComposeDataChange = useCallback((updates: Partial<ComposeData>) => {
    setComposeData(prev => {
      const next: Partial<ComposeData> = {
        ...prev,
        ...updates,
      };

      if (prev?.metadata || updates.metadata) {
        const mergedMetadata = {
          platform: updates.metadata?.platform ?? prev?.metadata?.platform ?? 'Facebook Page',
          ratio: updates.metadata?.ratio ?? prev?.metadata?.ratio ?? '1:1',
          ...(prev?.metadata || {}),
          ...(updates.metadata || {}),
        };

        next.metadata = mergedMetadata;
      }

      let hasChanges = false;

      if (updates.metadata) {
        const prevMeta = prev?.metadata;
        if (!isShallowEqual(prevMeta as Record<string, any> | undefined, next.metadata as Record<string, any> | undefined)) {
          hasChanges = true;
        }
      }

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'metadata') continue;
        const typedKey = key as ComposeDataKeys;
        const prevValue = prev?.[typedKey];
        if (Array.isArray(value) && Array.isArray(prevValue)) {
          if (!areArraysEqual(prevValue, value)) {
            hasChanges = true;
            break;
          }
          continue;
        }

        if (value !== prevValue) {
          hasChanges = true;
          break;
        }
      }

      return hasChanges ? next : prev;
    });
  }, [setComposeData]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Get search params for edit mode
  const searchParams = useSearchParams();
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState<boolean>(true);
  const [isCheckingAccounts, setIsCheckingAccounts] = useState<boolean>(true);
  
  // Ref to track if post data has been loaded (prevents re-fetching)
  const hasLoadedPostRef = useRef<boolean>(false);
  
  // Rate limit hook
  const { 
    rateLimitData, 
    checkRateLimit, 
    canCreatePost, 
    getBlockedReason, 
    getRateLimitMessage 
  } = usePostRateLimit();
  
  // Load post data when editing
  useEffect(() => {
    const editPostId = searchParams.get('edit');
    const scheduledDate = searchParams.get('date');
    
    // Prevent re-fetching if already loaded
    if (hasLoadedPostRef.current) {
      return;
    }
    
    if (editPostId) {
      hasLoadedPostRef.current = true;
      setEditingPostId(editPostId);
      setIsLoadingPost(true);
      
      // Fetch post data
      const loadPostData = async () => {
        try {
          const response = await fetch(`/api/posts?id=${editPostId}`);
          if (response.ok) {
            const posts = await response.json();
            // API returns array, find the post by ID
            const post = Array.isArray(posts) 
              ? posts.find((p: any) => p.id === editPostId) 
              : posts;
            
            if (post) {
              // Map post data to composeData format
              setComposeData({
                title: post.title || '',
                content: post.content || '',
                channels: post.providers || [],
                scheduleAt: post.scheduled_at || '',
                mediaUrls: post.media_urls || post.media || [],
                postId: post.id,
                aiContext: '',
                metadata: {
                  type: 'social',
                  platform: 'Facebook Page',
                  ratio: '1:1',
                  hashtags: '',
                  cta: 'Mua ngay',
                  brandColor: '#0ea5e9',
                }
              });
              
              console.log('Post loaded for editing:', post.title);
            } else {
              console.error('Post not found');
              router.push('/app');
            }
          } else {
            console.error('Failed to fetch post');
          }
        } catch (error) {
          console.error('Error loading post:', error);
        } finally {
          setIsLoadingPost(false);
        }
      };
      
      loadPostData();
    } else if (scheduledDate) {
      hasLoadedPostRef.current = true;
      // Pre-fill scheduled date if provided
      try {
        const date = new Date(scheduledDate);
        if (!isNaN(date.getTime())) {
          setComposeData(prev => ({
            ...prev,
            scheduleAt: date.toISOString()
          }));
        }
      } catch (e) {
        console.error('Invalid date param:', e);
      }
    }
  }, [searchParams, router]);

  // Check authentication and connected accounts
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
    
    // Check connected accounts
    const checkAccounts = async () => {
      try {
        setIsCheckingAccounts(true);
        const response = await fetch('/api/user/accounts');
        
        if (response.ok) {
          const data = await response.json();
          const hasAccounts = data.accounts && data.accounts.length > 0;
          setHasConnectedAccounts(hasAccounts);
          
          if (!hasAccounts) {
            showToast({
              title: 'Chưa kết nối tài khoản',
              message: 'Vui lòng kết nối ít nhất một tài khoản mạng xã hội để có thể đăng bài.',
              type: 'warning',
              duration: 10000
            });
          }
        }
      } catch (error) {
        console.error('Error checking accounts:', error);
      } finally {
        setIsCheckingAccounts(false);
      }
    };
    
    checkAccounts();
    
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
    
    // Check if user has connected accounts
    if (!hasConnectedAccounts) {
      showToast({
        title: 'Chưa kết nối tài khoản',
        message: 'Vui lòng kết nối ít nhất một tài khoản mạng xã hội trước khi đăng bài.',
        type: 'error',
        duration: 8000
      });
      
      // Redirect to settings after 2 seconds
      setTimeout(() => {
        router.push('/app?connect=true');
      }, 2000);
      
      return;
    }
    
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

    // Check if Instagram is selected but no media is uploaded
    if (data.channels.includes('instagram') && (!data.mediaUrls || data.mediaUrls.length === 0)) {
      showToast({ 
        message: 'Instagram yêu cầu phải có hình ảnh hoặc video. Vui lòng thêm media hoặc bỏ chọn Instagram.', 
        type: 'warning',
        duration: 5000
      });
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
        providers: mapProvidersToAPI(data.channels), // 🔥 MAP UI providers to API providers
        // Normalize to UTC ISO string to avoid timezone drift
        scheduled_at: data.scheduleAt ? new Date(data.scheduleAt).toISOString() : null,
        media_urls: data.mediaUrls || [],
        media_type: data.mediaType || 'none',
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
      
      // Show detailed success message based on action type
      const isScheduled = data.scheduleAt && new Date(data.scheduleAt) > new Date();
      const actionText = editingPostId 
        ? 'cập nhật' 
        : (isScheduled ? 'lên lịch' : 'tạo');
      
      const titleText = editingPostId 
        ? 'Cập nhật thành công!' 
        : (isScheduled ? 'Lên lịch thành công!' : 'Tạo bài thành công!');
      
      const scheduleInfo = isScheduled && data.scheduleAt 
        ? ` và sẽ được đăng vào ${new Date(data.scheduleAt).toLocaleString('vi-VN')}`
        : '';
      
      showToast({
        title: titleText,
        message: `Bài viết "${data.content?.substring(0, 50) || 'Không có tiêu đề'}..." đã được ${actionText} thành công cho ${result.post?.channels?.length || data.channels.length} kênh${scheduleInfo}.`,
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
      router.push('/app');
    }
  };

  // Confirm cancel action
  const confirmCancel = () => {
    router.push('/dashboard');
  };

  // Loading state
  if (status === 'loading' || isLoadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        {isLoadingPost && (
          <p className="text-gray-600">Đang tải thông tin bài viết...</p>
        )}
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
                onClick={() => router.push('/app')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Ứng Dụng
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
              disabled={isSubmitting || !hasConnectedAccounts || (!editingPostId && !canCreatePost())}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isSubmitting || !hasConnectedAccounts || (!editingPostId && !canCreatePost())
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={!hasConnectedAccounts ? 'Vui lòng kết nối tài khoản trước' : ''}
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

        {/* No Connected Accounts Warning */}
        {!isCheckingAccounts && !hasConnectedAccounts && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Chưa kết nối tài khoản mạng xã hội
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    Bạn cần kết nối ít nhất một tài khoản (Facebook, Instagram, hoặc Zalo) để có thể đăng bài.
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/app?connect=true')}
                className="ml-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                Kết nối ngay
              </button>
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
              onDataChange={handleComposeDataChange}
            />
          </div>

          {/* Center Panel - Editor & Preview */}
          <div className="lg:col-span-6">
            <ComposeCenterPanel
              activeTab={activeTab}
              composeData={composeData}
              onDataChange={handleComposeDataChange}
              showToast={showToast}
            />
          </div>

          {/* Right Panel - Scheduling & Channels */}
          <div className="lg:col-span-3">
            <ComposeRightPanel
              composeData={composeData}
              onDataChange={handleComposeDataChange}
              rateLimitData={rateLimitData}
              getRateLimitMessage={getRateLimitMessage}
              showToast={showToast}
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
                {editingPostId ? 'Cập nhật thành công!' : 
                  (composeData.scheduleAt && new Date(composeData.scheduleAt) > new Date() 
                    ? 'Lên lịch thành công!' 
                    : 'Tạo bài thành công!')}
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
                  onClick={() => router.push('/app')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Về Ứng Dụng
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

// Wrap with Suspense for useSearchParams
export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    }>
      <ComposePageContent />
    </Suspense>
  );
}
