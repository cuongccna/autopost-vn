'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import StatsCards from '@/components/shared/StatsCards';
import TabSelector from '@/components/shared/TabSelector';
import Calendar from '@/components/features/Calendar';
import Queue from '@/components/features/Queue';
import Analytics from '@/components/features/Analytics';
import Activities from '@/components/features/Activities';
import AccountsSidebar from '@/components/features/AccountsSidebar';
import SystemLog from '@/components/features/SystemLog';
import ActivityLogsWidget from '@/components/features/ActivityLogsWidget';
import FullActivityLogs from '@/components/features/FullActivityLogs';
import { ActivityLogsProvider, useActivityLogsRefresh } from '@/contexts/ActivityLogsContext';
import AccountsManagement from '@/components/features/AccountsManagement';
import Settings from '@/components/features/Settings';
import AddAccountModal from '@/components/features/AddAccountModal';
import { ToastContainer, useToast } from '@/components/shared/Toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { PROVIDERS, mapProvidersToAPI } from '@/lib/constants';

// Types
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

const mainTabs = [
  { id: 'calendar', label: 'Lịch' },
  { id: 'queue', label: 'Hàng đợi' },
  { id: 'analytics', label: 'Phân tích' },
  { id: 'activities', label: 'Hoạt động' },
];

export default function AppPage() {
  return (
    <ActivityLogsProvider>
      <AppPageContent />
    </ActivityLogsProvider>
  );
}

function AppPageContent() {
  const { logPostAction, logAccountAction, logWorkspaceAction } = useActivityLogger();
  const { refreshActivityLogs } = useActivityLogsRefresh();
  const [currentTab, setCurrentTab] = useState('calendar');
  const [currentMainTab, setCurrentMainTab] = useState('calendar');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isFullActivityLogsOpen, setIsFullActivityLogsOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]); // Start with empty array, load from API
  const [logs, setLogs] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    notifySuccess: true,
    notifyFail: true,
    notifyToken: true,
    timezone: 'Asia/Ho_Chi_Minh',
    golden: ['09:00', '12:30', '20:00'],
    rateLimit: 10,
    autoDelete: false,
    autoDeleteDays: 30,
    testMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, toast, removeToast } = useToast();

  // Helper function to add log with proper typing
  const addLog = (message: string) => {
    setLogs((prev: string[]) => [message, ...prev]);
  };

  // Fetch posts from API on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/posts');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API error:', response.status, errorText);
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert API posts to UI format
        const formattedPosts: Post[] = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          datetime: post.scheduled_at || post.created_at,
          providers: post.providers || [],
          status: post.status || 'draft',
          content: post.content,
          mediaUrls: post.media_urls || [],
        }));
        
        setPosts(formattedPosts);
        
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Lỗi khi tải bài đăng');
        // No fallback to mock data - show empty state
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Fetch user social accounts
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/user/accounts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert API accounts to UI format
      const formattedAccounts = data.accounts?.map((account: any) => ({
        id: account.id,
        name: account.account_name,
        provider: account.provider,
        status: account.status === 'connected' ? 'Đã kết nối' : 'Chưa kết nối',
        pageId: account.provider_account_id,
        tokenExpiry: account.token_expires_at,
      })) || [];
      
      // Use only API data, not mock data
      setAccounts(formattedAccounts);
      
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Set empty array if API fails
      setAccounts([]);
    }
  };

  // Handle OAuth success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const accountsCount = urlParams.get('accounts_saved') || urlParams.get('accounts'); // Support both parameter names
    const oauthError = urlParams.get('oauth_error');

    if (oauthSuccess) {
      const provider = oauthSuccess;
      const count = accountsCount ? parseInt(accountsCount) : 0;
      
      if (count > 0) {
        toast.success(`Kết nối ${provider} thành công! Tìm thấy ${count} tài khoản.`);
      } else {
        toast.warning(`Kết nối ${provider} thành công nhưng không tìm thấy tài khoản nào.`);
      }
      
      // Refresh accounts data
      fetchAccounts();
      
      // Clean URL
      window.history.replaceState({}, '', '/app');
    }

    if (oauthError) {
      console.error('❌ OAuth Error detected:', oauthError);
      
      // Handle special Instagram error with detailed instructions
      if (oauthError.includes('no_instagram_business_account')) {
        const hasPages = urlParams.get('pages_found');
        const noPages = urlParams.get('no_pages');
        
        let detailedMessage = '';
        if (noPages) {
          detailedMessage = 'Tài khoản Facebook của bạn chưa có Facebook Page nào. Vui lòng tạo Facebook Page trước khi kết nối Instagram.';
        } else if (hasPages) {
          detailedMessage = `Tìm thấy ${hasPages} Facebook Page nhưng không có Instagram Business Account nào được kết nối. Vui lòng:\n\n1. Chuyển Instagram sang Business Account\n2. Kết nối Instagram với Facebook Page\n3. Thử lại`;
        } else {
          detailedMessage = 'Tài khoản Facebook chưa có Instagram Business Account. Vui lòng chuyển đổi Instagram sang Business Account và kết nối với Facebook Page.';
        }
        
        toast.error(detailedMessage, {
          duration: 8000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        });
      } else {
        const errorMessages: Record<string, string> = {
          'invalid_state': 'Phiên kết nối không hợp lệ. Vui lòng thử lại.',
          'state_expired': 'Phiên kết nối đã hết hạn. Vui lòng thử lại.',
          'no_code': 'Không nhận được mã xác thực từ nhà cung cấp.',
          'token_exchange_failed': 'Lỗi trao đổi token. Vui lòng thử lại.',
          'fetch_pages_failed': 'Không thể lấy danh sách trang/tài khoản.',
          'server_error': 'Lỗi server. Vui lòng thử lại sau.',
          'access_denied': 'Bạn đã từ chối cấp quyền truy cập.',
          'profile_fetch_failed': 'Không thể lấy thông tin profile. Vui lòng thử lại.',
          'pages_fetch_failed': 'Không thể lấy danh sách pages. Vui lòng thử lại.',
          'database_error': 'Lỗi lưu dữ liệu. Vui lòng thử lại.'
        };
        
        const errorMessage = errorMessages[oauthError] || `Lỗi kết nối: ${oauthError}`;
        toast.error(errorMessage);
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  // Initial fetch of accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Calculate success rate based on real data
  const calculateSuccessRate = () => {
    if (posts.length === 0) return '0%';
    
    const publishedPosts = posts.filter(post => post.status === 'published').length;
    const successRate = Math.round((publishedPosts / posts.length) * 100);
    return `${successRate}%`;
  };

  // Calculate posts by provider
  const getPostsByProvider = () => {
    const providerCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      post.providers.forEach(provider => {
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      });
    });
    return providerCounts;
  };

  // Calculate success rate by provider
  const getSuccessRateByProvider = () => {
    const providerSuccess: { [key: string]: { published: number; total: number } } = {};
    
    posts.forEach(post => {
      post.providers.forEach(provider => {
        if (!providerSuccess[provider]) {
          providerSuccess[provider] = { published: 0, total: 0 };
        }
        providerSuccess[provider].total++;
        if (post.status === 'published') {
          providerSuccess[provider].published++;
        }
      });
    });

    const result: { [key: string]: string } = {};
    Object.entries(providerSuccess).forEach(([provider, data]) => {
      const rate = data.total > 0 ? Math.round((data.published / data.total) * 100) : 0;
      result[provider] = `${rate}%`;
    });
    
    return result;
  };

  const postsByProvider = getPostsByProvider();
  const successRateByProvider = getSuccessRateByProvider();

  const stats = [
    { 
      label: 'Bài đã lên lịch', 
      value: posts.length,
      subIndicators: Object.entries(postsByProvider).map(([provider, count]) => ({
        label: provider,
        value: count
      }))
    },
    { 
      label: 'Tỉ lệ thành công', 
      value: calculateSuccessRate(),
      progress: posts.length > 0 ? Math.round((posts.filter(post => post.status === 'published').length / posts.length) * 100) : 0,
      subIndicators: Object.entries(successRateByProvider).map(([provider, rate]) => ({
        label: provider,
        value: rate
      }))
    },
    { 
      label: 'Kênh kết nối', 
      value: accounts.length,
      subIndicators: accounts.map(account => ({
        label: account.provider,
        value: account.name || 'Đã kết nối'
      }))
    },
  ];

  const connectedProviders = accounts.map(acc => acc.provider);

  // Debug log
  console.log('📊 App - accounts:', accounts);
  console.log('🔗 App - connectedProviders:', connectedProviders);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (['calendar', 'queue', 'analytics', 'activities'].includes(tab)) {
      setCurrentMainTab(tab);
    }
  };

  // DEPRECATED: Old modal-based compose - now using /compose page
  /* const handleComposeSubmit = async (data: {
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
  }) => {
    try {
      const isEditing = !!data.postId;
      
      // Call API to create or update post
      const response = await fetch('/api/posts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isEditing && { id: data.postId }),
          title: data.title || data.content.slice(0, 60) + (data.content.length > 60 ? '...' : ''),
          content: data.content,
          providers: mapProvidersToAPI(data.channels),
          scheduled_at: new Date(data.scheduleAt).toISOString(),
          media_urls: data.mediaUrls,
          metadata: data.metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} bài đăng`);
      }

      const result = await response.json();
      const savedPost = result.post;

      // Create local post object for UI
      const postData: Post = {
        id: savedPost.id,
        title: savedPost.title,
        datetime: savedPost.scheduled_at || savedPost.created_at,
        providers: savedPost.providers || [],
        status: savedPost.status || 'scheduled',
        content: savedPost.content,
        mediaUrls: savedPost.media_urls || [],
      };
      
      if (isEditing) {
        // Update existing post
        setPosts(prev => prev.map(p => p.id === data.postId ? postData : p));
      } else {
        // Add new post
        setPosts(prev => [...prev, postData]);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const imageInfo = data.mediaUrls.length > 0 ? ` (${data.mediaUrls.length} ảnh)` : '';
      
      // Log activity
      const actionType = isEditing ? 'post_updated' : 'post_created';
      logPostAction(actionType, postData, 'success').catch(console.error);
      
      // Refresh activity logs after successful action
      setTimeout(() => {
        refreshActivityLogs();
      }, 500);
      
      if (isEditing) {
        setLogs((prev: string[]) => [`✔️ ${timeStr} — Cập nhật bài đăng thành công${imageInfo}`, ...prev]);
        toast.success(`Cập nhật bài đăng thành công!${imageInfo}`);
      } else {
        setLogs((prev: string[]) => [`✔️ ${timeStr} — Lên lịch bài mới thành công${imageInfo}`, ...prev]);
        toast.success(`Lên lịch bài đăng thành công!${imageInfo}`);
      }
    } catch (error: any) {
      console.error('Error creating/updating post:', error);
      
      // Only log failed activity if we have a valid post ID (when editing)
      if (data.postId) {
        const actionType = 'post_updated';
        const postData: Post = {
          id: data.postId,
          title: data.title || data.content.slice(0, 60),
          datetime: data.scheduleAt,
          providers: data.channels,
          status: 'failed',
          content: data.content,
          mediaUrls: data.mediaUrls || [],
        };
        logPostAction(actionType, postData, 'failed', error.message).catch(console.error);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const action = data.postId ? 'cập nhật' : 'tạo';
      setLogs((prev: string[]) => [`❌ ${timeStr} — Lỗi ${action} bài đăng: ${error.message}`, ...prev]);
      toast.error(`Lỗi ${action} bài đăng: ${error.message}`);
    }
  }; */

  const handleAddAccount = () => {
    setIsAddAccountOpen(true);
  };

  // Calendar handlers
  const handleUpdatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      // Call API to update post
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: postId,
          ...updates,
          // Convert datetime back to scheduled_at for API
          scheduled_at: updates.datetime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi cập nhật bài đăng');
      }

      // Update local state only if API call succeeds
      const updatedPost = posts.find(p => p.id === postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      ));
      
      // Log activity
      if (updatedPost) {
        logPostAction('post_updated', {
          ...updatedPost,
          ...updates
        }, 'success').catch(console.error);
        
        // Refresh activity logs after successful action
        setTimeout(() => {
          refreshActivityLogs();
        }, 500);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (updates.datetime) {
        const newDate = new Date(updates.datetime).toLocaleDateString('vi-VN');
        setLogs((prev: string[]) => [`📅 ${timeStr} — Đã chuyển bài đến ${newDate}`, ...prev]);
        toast.success(`Đã chuyển bài đến ${newDate}`);
      } else {
        setLogs((prev: string[]) => [`✔️ ${timeStr} — Cập nhật bài đăng thành công`, ...prev]);
        toast.success('Cập nhật bài đăng thành công!');
      }
      
    } catch (error: any) {
      console.error('Error updating post:', error);
      
      // Log failed activity
      const updatedPost = posts.find(p => p.id === postId);
      if (updatedPost) {
        logPostAction('post_updated', {
          ...updatedPost,
          ...updates
        }, 'failed', error.message).catch(console.error);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLogs((prev: string[]) => [`❌ ${timeStr} — Lỗi cập nhật bài: ${error.message}`, ...prev]);
      toast.error(`Lỗi cập nhật bài đăng: ${error.message}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      // Call API to delete post
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi xóa bài đăng');
      }

      // Only update local state if API call succeeds
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        
        // Log successful deletion
        logPostAction('post_deleted', post, 'success').catch(console.error);
        
        // Refresh activity logs after successful action
        setTimeout(() => {
          refreshActivityLogs();
        }, 500);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs((prev: string[]) => [`🗑️ ${timeStr} — Đã xóa bài: ${post.title}`, ...prev]);
        toast.success('Đã xóa bài đăng thành công!');
      }
      
    } catch (error: any) {
      console.error('Error deleting post:', error);
      
      // Log failed deletion
      const post = posts.find(p => p.id === postId);
      if (post) {
        logPostAction('post_deleted', post, 'failed', error.message).catch(console.error);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLogs((prev: string[]) => [`❌ ${timeStr} — Lỗi xóa bài: ${error.message}`, ...prev]);
      toast.error(`Lỗi xóa bài đăng: ${error.message}`);
    }
  };

  const handleEditPost = (post: Post) => {
    // Chuyển đến trang /compose với post ID để edit
    window.location.href = `/compose?edit=${post.id}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs((prev: string[]) => [`✏️ ${timeStr} — Mở chỉnh sửa bài: ${post.title}`, ...prev]);
  };

  const handleCreatePostFromCalendar = (date: Date) => {
    // Chuyển đến trang /compose với ngày được chọn
    const dateParam = date.toISOString();
    window.location.href = `/compose?date=${encodeURIComponent(dateParam)}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN');
    setLogs((prev: string[]) => [`📝 ${timeStr} — Tạo bài đăng mới cho ngày ${dateStr}`, ...prev]);
  };

  const handleRefreshToken = async (accountId: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setLogs((prev: string[]) => [`ℹ️ ${timeStr} — Làm mới token cho ${account.name}`, ...prev]);
      toast.info(`Đang làm mới token cho ${account.name}...`);
      
      // Simulate token refresh
      setTimeout(() => {
        setAccounts(prev => prev.map(acc => 
          acc.id === accountId 
            ? { ...acc, tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() }
            : acc
        ));
        setLogs((prev: string[]) => [`✔️ ${timeStr} — Token ${account.name} đã được làm mới`, ...prev]);
        toast.success(`Token ${account.name} đã được làm mới thành công`);
      }, 1000);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        toast.error('Không tìm thấy tài khoản để hủy kết nối.');
        return;
      }

      // Show loading toast
      toast.info(`Đang hủy kết nối ${account.name}...`);

      // Call disconnect API
      const response = await fetch(`/api/user/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove from UI
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        
        // Log account disconnection
        logAccountAction('account_disconnected', account, 'success').catch(console.error);
        
        // Refresh activity logs after successful action
        setTimeout(() => {
          refreshActivityLogs();
        }, 500);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLogs((prev: string[]) => [`⚠️ ${timeStr} — Ngắt kết nối ${account.name}`, ...prev]);
        toast.success(`Đã hủy kết nối ${account.name} thành công!`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Lỗi khi hủy kết nối tài khoản. Vui lòng thử lại.');
    }
  };

  const handleConnectAccount = async (provider: string) => {
    // Check if provider already connected
    if (accounts.some(acc => acc.provider === provider)) {
      toast.warning(`${PROVIDERS[provider as keyof typeof PROVIDERS]?.label} đã được kết nối rồi!`);
      return;
    }

    try {
      // Redirect to OAuth endpoint for secure account connection
      const baseUrl = window.location.origin;
      const oauthUrl = `${baseUrl}/api/auth/oauth/${provider}`;
      
      // Close modal first
      setIsAddAccountOpen(false);
      
      // Show loading toast
      toast.info(`Đang chuyển hướng đến ${PROVIDERS[provider as keyof typeof PROVIDERS]?.label || provider}...`);
      
      // Redirect to OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('OAuth redirect failed:', error);
      toast.error('Lỗi khi kết nối tài khoản. Vui lòng thử lại.');
    }
  };

  const handleDisconnectAccountByProvider = async (provider: string) => {
    // Find the account to disconnect
    const accountToDisconnect = accounts.find(acc => acc.provider === provider);
    if (!accountToDisconnect) {
      toast.error('Không tìm thấy tài khoản để hủy kết nối.');
      return;
    }

    // Call the existing disconnect function with account ID
    await handleDisconnectAccount(accountToDisconnect.id);
    
    // Close modal after successful disconnect
    setIsAddAccountOpen(false);
  };

  const handleSaveSettings = async (newSettings: typeof settings) => {
    // Detect changes
    const changes: Record<string, any> = {};
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key as keyof typeof settings] !== settings[key as keyof typeof settings]) {
        changes[key] = {
          from: settings[key as keyof typeof settings],
          to: newSettings[key as keyof typeof settings]
        };
      }
    });

    setSettings(newSettings);
    
    // Log settings update
    logWorkspaceAction('settings_updated', {
      changes: Object.keys(changes),
      settings_data: changes
    }, 'success').catch(console.error);
    
    // Refresh activity logs after successful action
    setTimeout(() => {
      refreshActivityLogs();
    }, 500);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs((prev: string[]) => [`✔️ ${timeStr} — Lưu cài đặt thành công`, ...prev]);
    toast.success('Đã lưu cài đặt thành công!');
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      notifySuccess: true,
      notifyFail: true,
      notifyToken: true,
      timezone: 'Asia/Ho_Chi_Minh',
      golden: ['09:00', '12:30', '20:00'],
      rateLimit: 10,
      autoDelete: false,
      autoDeleteDays: 30,
      testMode: false,
    };
    setSettings(defaultSettings);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs((prev: string[]) => [`ℹ️ ${timeStr} — Khôi phục cài đặt mặc định`, ...prev]);
    toast.info('Đã khôi phục cài đặt mặc định');
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải bài đăng...</p>
          </div>
        </div>
      );
    }

    switch (currentMainTab) {
      case 'calendar':
        return (
          <Calendar 
            posts={posts}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
            onCreatePost={handleCreatePostFromCalendar}
          />
        );
      case 'queue':
        return <Queue posts={posts} />;
      case 'analytics':
        return <Analytics posts={posts} />;
      case 'activities':
        return <Activities />;
      default:
        return (
          <Calendar 
            posts={posts}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
            onCreatePost={handleCreatePostFromCalendar}
          />
        );
    }
  };

  const renderTabContent = () => {
    if (['calendar', 'queue', 'analytics', 'activities'].includes(currentTab)) {
      return renderMainContent();
    }
    
    switch (currentTab) {
      case 'accounts':
        return (
          <AccountsManagement
            accounts={accounts}
            onRefreshToken={handleRefreshToken}
            onDisconnectAccount={handleDisconnectAccount}
            onConnectAccount={handleConnectAccount}
            onOpenAddModal={handleAddAccount}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetSettings={handleResetSettings}
          />
        );
      default:
        return renderMainContent();
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
        goldenHours={settings.golden}
      />
      
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar 
          onOpenCompose={() => window.location.href = '/compose'} 
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
        
        <div className="grid flex-1 grid-rows-[auto,1fr] gap-4 p-4">
          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {['calendar', 'queue', 'analytics'].includes(currentTab) && (
                <TabSelector
                  tabs={mainTabs}
                  currentTab={currentMainTab}
                  onTabChange={setCurrentMainTab}
                />
              )}
              
              {renderTabContent()}
            </div>
            
            <div className="space-y-4 xl:block hidden">
              <AccountsSidebar 
                accounts={accounts} 
                onAddAccount={handleAddAccount}
                connectedProviders={connectedProviders}
              />
              <ActivityLogsWidget onViewAll={() => setIsFullActivityLogsOpen(true)} />
            </div>
          </div>
        </div>
      </main>
      
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onConnect={handleConnectAccount}
        onDisconnect={handleDisconnectAccountByProvider}
        connectedProviders={connectedProviders}
      />
      
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <FullActivityLogs
        isOpen={isFullActivityLogsOpen}
        onClose={() => setIsFullActivityLogsOpen(false)}
      />
    </div>
  );
}
