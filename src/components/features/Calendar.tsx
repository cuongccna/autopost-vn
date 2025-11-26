'use client';

import { useState, useEffect } from 'react';
import { startOfWeek as getStartOfWeekFromDate } from 'date-fns';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { PROVIDERS } from '@/lib/constants';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import PostDetailModal from './PostDetailModal';
import type { Post } from '@/types/Post';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// Status icons với tooltips
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled': return { icon: '⏰', tooltip: 'Đã lên lịch' };
    case 'published': return { icon: '✅', tooltip: 'Đã đăng thành công' };
    case 'failed': return { icon: '❌', tooltip: 'Đăng thất bại' };
    default: return { icon: '📝', tooltip: 'Bản nháp' };
  }
};

// Provider icons nhỏ gọn hơn
const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'facebook': return '📘';
    case 'instagram': return '📷';
    case 'zalo': return '💬';
    case 'tiktok': return '🎵';
    default: return '📱';
  }
};

interface DraggablePostProps {
  post: Post;
  onClick: () => void;
}

function DraggablePost({ post, onClick }: DraggablePostProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: post.id,
    disabled: post.status !== 'scheduled',
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'scheduled': 
        return {
          border: 'border-l-4 border-l-blue-500 border-y border-r border-blue-100',
          bg: 'bg-gradient-to-r from-blue-50 to-white',
          hover: 'hover:from-blue-100 hover:to-blue-50',
          badge: 'bg-blue-100 text-blue-700',
        };
      case 'published': 
        return {
          border: 'border-l-4 border-l-green-500 border-y border-r border-green-100',
          bg: 'bg-gradient-to-r from-green-50 to-white',
          hover: 'hover:from-green-100 hover:to-green-50',
          badge: 'bg-green-100 text-green-700',
        };
      case 'failed': 
        return {
          border: 'border-l-4 border-l-red-500 border-y border-r border-red-100',
          bg: 'bg-gradient-to-r from-red-50 to-white',
          hover: 'hover:from-red-100 hover:to-red-50',
          badge: 'bg-red-100 text-red-700',
        };
      default: 
        return {
          border: 'border-l-4 border-l-gray-400 border-y border-r border-gray-100',
          bg: 'bg-gradient-to-r from-gray-50 to-white',
          hover: 'hover:from-gray-100 hover:to-gray-50',
          badge: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const statusInfo = getStatusIcon(post.status);
  const styles = getStatusStyles(post.status);
  
  // Tạo tooltip đầy đủ thông tin
  const createTooltip = () => {
    const lines = [
      `📄 ${post.title || 'Không có tiêu đề'}`,
      '',
      `📅 ${formatTime(new Date(post.datetime))} - ${new Date(post.datetime).toLocaleDateString('vi-VN')}`,
      `${statusInfo.icon} ${statusInfo.tooltip}`,
      '',
    ];
    
    if (post.content) {
      lines.push(`💭 Nội dung:`);
      lines.push(post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content);
      lines.push('');
    }
    
    if (post.providers.length > 0) {
      lines.push(`📱 Đăng lên: ${post.providers.map(p => PROVIDERS[p as keyof typeof PROVIDERS]?.label || p).join(', ')}`);
    }
    
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      lines.push(`🖼️ ${post.mediaUrls.length} file media`);
    }
    
    if (post.status === 'failed' && post.error) {
      lines.push('');
      lines.push(`❌ Lỗi: ${post.error}`);
    }
    
    lines.push('');
    lines.push('👆 Click để xem chi tiết và chỉnh sửa');
    if (post.status === 'scheduled') {
      lines.push('🔄 Kéo thả để thay đổi ngày đăng');
    }
    
    return lines.join('\n');
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg ${styles.border} ${styles.bg} ${styles.hover} transition-all duration-200 ${
        isDragging ? 'opacity-60 rotate-2 scale-105 shadow-lg z-50' : 'hover:shadow-md'
      }`}
    >
      {/* Drag Handle - Chỉ hiện khi status = scheduled */}
      {post.status === 'scheduled' && (
        <div 
          {...attributes}
          {...listeners}
          className="absolute -left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-blue-100 hover:bg-blue-200 rounded-l-lg transition-colors border-r border-blue-200"
          title="Kéo để thay đổi ngày"
        >
          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="2"/>
            <circle cx="15" cy="6" r="2"/>
            <circle cx="9" cy="12" r="2"/>
            <circle cx="15" cy="12" r="2"/>
            <circle cx="9" cy="18" r="2"/>
            <circle cx="15" cy="18" r="2"/>
          </svg>
        </div>
      )}

      {/* Content area - Click để xem chi tiết */}
      <div 
        className={`p-2 cursor-pointer ${post.status === 'scheduled' ? 'ml-6' : ''}`}
        onClick={onClick}
      >
        {/* Header với time và status badge */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${styles.badge}`}>
            {formatTime(new Date(post.datetime))}
          </span>
          
          {/* Providers icons */}
          <div className="flex gap-0.5">
            {post.providers.slice(0, 3).map((provider, index) => (
              <span
                key={`${post.id}-${provider}-${index}`}
                className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-sm text-xs"
                title={PROVIDERS[provider as keyof typeof PROVIDERS]?.label || provider}
              >
                {getProviderIcon(provider)}
              </span>
            ))}
            {post.providers.length > 3 && (
              <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                +{post.providers.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-1.5 mb-1">
          <span className="text-sm" title={statusInfo.tooltip}>
            {statusInfo.icon}
          </span>
          <span className="text-xs font-medium text-gray-800 line-clamp-2 flex-1">
            {post.title || <span className="text-gray-400 italic">Không có tiêu đề</span>}
          </span>
        </div>

        {/* Media indicator */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>🖼️</span>
            <span>{post.mediaUrls.length} media</span>
          </div>
        )}

        {/* Error message for failed posts */}
        {post.status === 'failed' && post.error && (
          <div className="mt-1.5 p-1.5 bg-red-100 rounded text-xs text-red-700 line-clamp-1">
            ⚠️ {post.error}
          </div>
        )}
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  date: Date;
  posts: Post[];
  dayName: string;
  dayIndex: number;
  onPostClick: (_post: Post) => void;
  onCreatePost?: (_date: Date) => void;
  isMobile?: boolean;
}

function DroppableColumn({ date, posts, dayName, dayIndex, onPostClick, onCreatePost, isMobile = false }: DroppableColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: `day-${dayIndex}`,
  });

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date() && !isToday;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  const handleCreatePost = () => {
    if (onCreatePost && !isPast) {
      onCreatePost(date);
    }
  };

  // Format date cho mobile và desktop
  const formatDateDisplay = () => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  // Đếm số bài theo status
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const failedCount = posts.filter(p => p.status === 'failed').length;
  
  return (
    <div 
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all duration-200 flex flex-col ${
        isMobile ? 'min-h-[140px]' : 'min-h-[220px]'
      } ${
        isToday 
          ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100' 
          : isWeekend && !isPast
            ? 'border-purple-200 bg-purple-50/30'
            : isPast 
              ? 'border-gray-200 bg-gray-50/50 opacity-75' 
              : 'border-gray-200 bg-white hover:border-gray-300'
      } ${isOver ? 'ring-4 ring-blue-300 ring-opacity-60 bg-blue-100/50 scale-[1.02] shadow-xl' : ''}`}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b ${
        isToday 
          ? 'bg-blue-100 border-blue-200' 
          : isWeekend && !isPast
            ? 'bg-purple-100/50 border-purple-200'
            : isPast 
              ? 'bg-gray-100 border-gray-200' 
              : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${isToday ? 'animate-pulse' : ''}`}>
              {isToday ? '📍' : isPast ? '📋' : isWeekend ? '🌴' : '📅'}
            </span>
            <div>
              <div className={`font-bold ${isMobile ? 'text-sm' : 'text-base'} ${
                isToday ? 'text-blue-700' : isPast ? 'text-gray-500' : 'text-gray-800'
              }`}>
                {isMobile ? formatDateDisplay() : `${dayName} ${formatDateDisplay()}`}
              </div>
              {isToday && (
                <div className="text-xs text-blue-600 font-medium">Hôm nay</div>
              )}
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-1">
            {scheduledCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium" title={`${scheduledCount} đã lên lịch`}>
                {scheduledCount}
              </span>
            )}
            {publishedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-medium" title={`${publishedCount} đã đăng`}>
                {publishedCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium" title={`${failedCount} thất bại`}>
                {failedCount}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 p-2 overflow-y-auto">
        {/* Drop zone indicator */}
        {isOver && (
          <div className="mb-2 py-3 border-2 border-dashed border-blue-400 rounded-lg bg-blue-100/80 text-center">
            <div className="text-xl mb-1">📥</div>
            <span className="text-xs text-blue-700 font-medium">
              Thả bài vào đây
            </span>
          </div>
        )}
        
        {/* Posts */}
        <div className="space-y-2">
          {posts.length > 0 ? (
            posts.map(post => (
              <DraggablePost 
                key={post.id}
                post={post} 
                onClick={() => onPostClick(post)}
              />
            ))
          ) : !isOver && (
            <div className={`text-center py-4 ${isMobile ? 'py-3' : 'py-6'}`}>
              <div className="text-3xl mb-2 opacity-50">
                {isPast ? '📭' : '✨'}
              </div>
              <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isPast ? 'Không có bài' : 'Chưa có bài đăng'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create post button - Fixed at bottom */}
      {!isPast && (
        <div className="p-2 pt-0">
          <button
            onClick={handleCreatePost}
            className={`w-full py-2 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
              posts.length === 0 
                ? 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400' 
                : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title="Tạo bài đăng mới"
          >
            <span className="text-base">➕</span>
            {!isMobile && (
              <span className="text-xs font-medium">
                {posts.length === 0 ? 'Thêm bài đầu tiên' : 'Thêm bài'}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Calendar({ posts, onUpdatePost, onDeletePost, onEditPost, onCreatePost }: {
  posts: Post[];
  onUpdatePost?: (_postId: string, _updates: Partial<Post>) => void;
  onDeletePost?: (_postId: string) => void;
  onEditPost?: (_post: Post) => void;
  onCreatePost?: (_date: Date) => void;
}) {
  const { logPostAction } = useActivityLogger();
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const start = getStartOfWeekFromDate(currentWeek, { weekStartsOn: 1 });
  const dayNames = isMobile 
    ? ['T 2', 'T 3', 'T 4', 'T 5', 'T 6', 'T 7', 'CN']
    : ['T 2', 'T 3', 'T 4', 'T 5', 'T 6', 'T 7', 'CN'];
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    const dayPosts = posts
      .filter(p => {
        const postDate = new Date(p.datetime);
        return (
          postDate.getFullYear() === date.getFullYear() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getDate() === date.getDate()
        );
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    
    return { date, posts: dayPosts, dayName: dayNames[i] };
  });

  const handleDragStart = (event: DragStartEvent) => {
    const post = posts.find(p => p.id === event.active.id);
    setActivePost(post || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePost(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Tìm post được kéo
    const draggedPost = posts.find(p => p.id === active.id);
    if (!draggedPost || draggedPost.status !== 'scheduled') {
      return; // Chỉ cho phép kéo bài đã lên lịch
    }

    // Tìm ngày đích
    const targetDayIndex = parseInt(over.id.toString().replace('day-', ''));
    if (isNaN(targetDayIndex)) return;

    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + targetDayIndex);
    
    // Giữ nguyên giờ phút, chỉ thay đổi ngày
    const currentDateTime = new Date(draggedPost.datetime);
    const newDateTime = new Date(targetDate);
    newDateTime.setHours(currentDateTime.getHours());
    newDateTime.setMinutes(currentDateTime.getMinutes());

    // Cập nhật bài đăng
    if (onUpdatePost) {
      onUpdatePost(draggedPost.id, {
        datetime: newDateTime.toISOString()
      });
      
      // Log activity
      logPostAction('post_updated', {
        ...draggedPost,
        datetime: newDateTime.toISOString()
      }, 'success').catch(console.error);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const handleReschedule = (postId: string, newDateTime: string) => {
    if (onUpdatePost) {
      const post = posts.find(p => p.id === postId);
      onUpdatePost(postId, {
        datetime: new Date(newDateTime).toISOString()
      });
      
      // Log activity
      if (post) {
        logPostAction('post_updated', {
          ...post,
          datetime: new Date(newDateTime).toISOString()
        }, 'success').catch(console.error);
      }
    }
  };

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const formatWeekRange = () => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    if (isMobile) {
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    }
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} tháng ${start.getMonth() + 1}, ${start.getFullYear()}`;
    } else {
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}, ${start.getFullYear()}`;
    }
  };

  const totalPosts = posts.length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const failedPosts = posts.filter(p => p.status === 'failed').length;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              Lịch tuần
            </h3>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {formatWeekRange()}
            </p>
            {/* Quick stats for mobile */}
            {isMobile && (
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>⏰ {scheduledPosts}</span>
                <span>✅ {publishedPosts}</span>
                <span>❌ {failedPosts}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Tuần trước"
            >
              <span className="text-sm">⬅️</span>
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors ${
                isMobile ? 'text-xs px-2' : ''
              }`}
            >
              {isMobile ? 'Hôm nay' : 'Hôm nay'}
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Tuần sau"
            >
              <span className="text-sm">➡️</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`grid gap-3 ${
          isMobile 
            ? 'grid-cols-2' // Mobile: 2 columns for better readability
            : 'grid-cols-7' // Desktop: full week view
        }`}>
          {weekDays.map((day, index) => (
            <div key={index} id={`day-${index}`}>
              <DroppableColumn
                date={day.date}
                posts={day.posts}
                dayName={day.dayName}
                dayIndex={index}
                onPostClick={handlePostClick}
                onCreatePost={onCreatePost}
                isMobile={isMobile}
              />
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className={`mt-4 text-gray-500 text-center ${
          isMobile ? 'text-xs' : 'text-xs'
        }`}>
          {isMobile 
            ? '👆 Click bài • 🔄 Kéo đổi ngày'
            : '👆 Click vào bài đăng để xem chi tiết • 🔄 Kéo thả để thay đổi ngày đăng'
          }
        </div>

        {/* Stats bar for desktop */}
        {!isMobile && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">{totalPosts}</div>
              <div className="text-xs text-gray-500">📝 Tổng bài</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{scheduledPosts}</div>
              <div className="text-xs text-gray-500">⏰ Đã lên lịch</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{publishedPosts}</div>
              <div className="text-xs text-gray-500">✅ Đã đăng</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{failedPosts}</div>
              <div className="text-xs text-gray-500">❌ Thất bại</div>
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activePost ? (
            <div className="transform rotate-3 opacity-90">
              <DraggablePost 
                post={activePost} 
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </section>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
        }}
        onEdit={onEditPost}
        onDelete={onDeletePost}
        onReschedule={handleReschedule}
      />
    </DndContext>
  );
}
