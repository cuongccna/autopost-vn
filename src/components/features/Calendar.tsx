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
import PostDetailModal from './PostDetailModal';

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

interface CalendarProps {
  posts: Post[];
  onUpdatePost?: (_postId: string, _updates: Partial<Post>) => void;
  onDeletePost?: (_postId: string) => void;
  onEditPost?: (_post: Post) => void;
  onCreatePost?: (_date: Date) => void;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d;
}

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'published': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'failed': return 'border-red-200 bg-red-50 hover:bg-red-100';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const statusInfo = getStatusIcon(post.status);
  
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
      {...attributes}
      {...listeners}
      className={`group relative rounded-lg border p-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(post.status)} ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      } ${post.status === 'scheduled' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      onClick={onClick}
      title={createTooltip()}
    >
      {/* Header với status và time */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm" title={statusInfo.tooltip}>
            {statusInfo.icon}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {formatTime(new Date(post.datetime))}
          </span>
        </div>
        
        {/* Providers icons */}
        <div className="flex gap-0.5">
          {post.providers.slice(0, 3).map(provider => (
            <span
              key={provider}
              className="text-xs"
              title={PROVIDERS[provider as keyof typeof PROVIDERS]?.label || provider}
            >
              {getProviderIcon(provider)}
            </span>
          ))}
          {post.providers.length > 3 && (
            <span className="text-xs text-gray-400" title={`+${post.providers.length - 3} thêm`}>
              +{post.providers.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Content preview với tooltip - chỉ hiển thị tiêu đề */}
      <div className="text-sm text-gray-700 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📄</span>
          <span className="text-xs font-medium truncate flex-1">
            {post.title ? (
              post.title.length > 20 ? post.title.substring(0, 20) + '...' : post.title
            ) : (
              <span className="text-gray-500">Không có tiêu đề</span>
            )}
          </span>
        </div>
      </div>

      {/* Media indicator - tối giản */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="absolute top-1 right-1">
          <span className="text-xs bg-white bg-opacity-80 px-1 rounded" title={`${post.mediaUrls.length} file media`}>
            🖼️
          </span>
        </div>
      )}

      {/* Error indicator for failed posts */}
      {post.status === 'failed' && post.error && (
        <div className="mt-1 text-xs text-red-600 truncate" title={post.error}>
          ⚠️ {post.error}
        </div>
      )}

      {/* Drag hint for scheduled posts */}
      {post.status === 'scheduled' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center transition-opacity">
          <span className="text-xs text-blue-700 font-medium">⬌ Kéo thả</span>
        </div>
      )}
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
  
  const handleCreatePost = () => {
    if (onCreatePost && !isPast) {
      onCreatePost(date);
    }
  };

  // Format date cho mobile và desktop
  const formatDateDisplay = () => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if (isMobile) {
      return `${day}/${month}`;
    }
    return `${day}/${month}`;
  };

  // Icons cho từng ngày
  const getDayIcon = () => {
    if (isToday) return '📅';
    if (isPast) return '📄';
    if (date.getDay() === 0 || date.getDay() === 6) return '🏖️'; // Weekend
    return '📋';
  };
  
  return (
    <div 
      ref={setNodeRef}
      className={`rounded-xl border transition-all duration-200 ${
        isMobile ? 'p-2 min-h-[120px]' : 'p-3 min-h-[200px]'
      } ${
        isToday ? 'border-blue-300 bg-blue-50 shadow-md' : 
        isPast ? 'border-gray-200 bg-gray-50' : 
        'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-100 scale-105' : ''}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className={`flex items-center gap-1 font-medium ${
          isToday ? 'text-blue-700' : isPast ? 'text-gray-500' : 'text-gray-900'
        }`}>
          <span className="text-sm" title={isToday ? 'Hôm nay' : isPast ? 'Đã qua' : 'Sắp tới'}>
            {getDayIcon()}
          </span>
          <span className={isMobile ? 'text-xs' : 'text-sm'}>
            {isMobile ? formatDateDisplay() : `${dayName} ${formatDateDisplay()}`}
          </span>
        </div>
        
        {/* Post count badge */}
        {posts.length > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isToday ? 'bg-blue-200 text-blue-800' : 
            posts.some(p => p.status === 'failed') ? 'bg-red-100 text-red-700' :
            posts.some(p => p.status === 'scheduled') ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {posts.length}
          </span>
        )}
      </div>
      
      {/* Drop zone indicator */}
      {isOver && (
        <div className="mb-2 text-center py-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
          <div className="text-lg mb-1">📅</div>
          <span className="text-xs text-blue-600">
            {isMobile ? 'Thả bài' : 'Thả để chuyển bài'}
          </span>
        </div>
      )}
      
      {/* Posts */}
      <div className="space-y-2">
        {posts.length ? (
          posts.map(post => (
            <div key={post.id} data-post-id={post.id}>
              <DraggablePost 
                post={post} 
                onClick={() => onPostClick(post)}
              />
            </div>
          ))
        ) : (
          <div className={`text-center py-4 ${
            isMobile ? 'py-2' : 'py-6'
          } ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-2xl mb-1">
              {isPast ? '📋' : '✨'}
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isPast ? 'Đã qua' : 'Trống'}
            </div>
          </div>
        )}
        
        {/* Create post button */}
        {!isPast && (
          <button
            onClick={handleCreatePost}
            className={`w-full py-3 px-3 rounded-lg border-2 border-dashed transition-all group ${
              isMobile ? 'py-2' : 'py-3'
            } ${
              posts.length === 0 
                ? 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400' 
                : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title={posts.length === 0 ? 'Tạo bài đăng đầu tiên' : 'Thêm bài đăng mới'}
          >
            <div className="flex items-center justify-center">
              <span className="group-hover:scale-110 transition-transform text-lg">
                {posts.length === 0 ? '✨' : '➕'}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Calendar({ posts, onUpdatePost, onDeletePost, onEditPost, onCreatePost }: CalendarProps) {
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

  const start = getStartOfWeekFromDate(currentWeek);
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
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const handleReschedule = (postId: string, newDateTime: string) => {
    if (onUpdatePost) {
      onUpdatePost(postId, {
        datetime: new Date(newDateTime).toISOString()
      });
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
