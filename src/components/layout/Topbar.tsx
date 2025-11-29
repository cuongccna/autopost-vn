'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileSidebar from './MobileSidebar';
import { UserAvatarDropdown } from '../shared/UserAvatarDropdown';
import AIStatusCompact from '../shared/AIStatusCompact';
import AIStatusBadge from '../shared/AIStatusBadge';
import { toast } from '@/lib/utils/toast';

interface TopbarProps {
  onOpenCompose?: () => void; // Make optional for backward compatibility
  currentTab: string;
  onTabChange: (_tab: string) => void;
}

interface SearchResult {
  id: string;
  type: 'post' | 'account' | 'error';
  title: string;
  subtitle?: string;
  icon: string;
}

export default function Topbar({ onOpenCompose, currentTab, onTabChange }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState<boolean | null>(null);
  const [isCheckingAccounts, setIsCheckingAccounts] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Check connected accounts on mount
  useEffect(() => {
    const checkAccounts = async () => {
      try {
        setIsCheckingAccounts(true);
        const response = await fetch('/api/user/accounts');
        
        if (response.ok) {
          const data = await response.json();
          const hasAccounts = data.accounts && data.accounts.length > 0;
          setHasConnectedAccounts(hasAccounts);
        } else {
          setHasConnectedAccounts(false);
        }
      } catch (error) {
        console.error('Error checking accounts:', error);
        setHasConnectedAccounts(false);
      } finally {
        setIsCheckingAccounts(false);
      }
    };
    
    checkAccounts();
  }, []);

  const handleCreatePost = () => {
    // Check if user has connected accounts
    if (hasConnectedAccounts === false) {
      toast.warning('Vui lòng kết nối ít nhất một tài khoản mạng xã hội trước khi tạo bài đăng.');
      // Navigate to accounts tab
      onTabChange('accounts');
      return;
    }
    
    // Navigate to compose page
    router.push('/compose');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // Search in posts, accounts, and activity logs
      const [postsRes, accountsRes, logsRes] = await Promise.all([
        fetch(`/api/posts?search=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { posts: [] }),
        fetch(`/api/user/accounts?search=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { accounts: [] }),
        fetch(`/api/activity-logs?limit=5&search=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { logs: [] }),
      ]);

      const results: SearchResult[] = [];

      // Add posts
      if (postsRes.posts) {
        postsRes.posts.slice(0, 3).forEach((post: any) => {
          results.push({
            id: post.id,
            type: 'post',
            title: post.title || 'Bài đăng không có tiêu đề',
            subtitle: post.content?.substring(0, 50) + '...',
            icon: '📝',
          });
        });
      }

      // Add accounts
      if (accountsRes.accounts) {
        accountsRes.accounts.slice(0, 3).forEach((account: any) => {
          results.push({
            id: account.id,
            type: 'account',
            title: account.account_name || account.name,
            subtitle: account.provider,
            icon: account.provider === 'facebook' ? '📘' : account.provider === 'instagram' ? '📷' : '💬',
          });
        });
      }

      // Add errors from activity logs
      if (logsRes.logs) {
        logsRes.logs
          .filter((log: any) => log.status === 'failed')
          .slice(0, 2)
          .forEach((log: any) => {
            results.push({
              id: log.id,
              type: 'error',
              title: log.description || 'Lỗi không xác định',
              subtitle: new Date(log.created_at).toLocaleString('vi-VN'),
              icon: '❌',
            });
          });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    switch (result.type) {
      case 'post':
        onTabChange('calendar');
        break;
      case 'account':
        onTabChange('accounts');
        break;
      case 'error':
        onTabChange('activities');
        break;
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <MobileSidebar currentTab={currentTab} onTabChange={onTabChange} />
        <div className="relative hidden md:block" ref={searchRef}>
          <input 
            className="w-80 rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Tìm bài, kênh, lỗi…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                  <span className="ml-2">Đang tìm...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Không tìm thấy kết quả cho &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                    >
                      <span className="text-2xl">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {result.type === 'post' ? 'Bài đăng' : result.type === 'account' ? 'Tài khoản' : 'Lỗi'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AIStatusCompact />
        <button 
          onClick={handleCreatePost}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <span className="hidden sm:inline">➕ Tạo bài đăng</span>
          <span className="sm:hidden">➕</span>
        </button>
        <UserAvatarDropdown />
      </div>
    </div>
  );
}
