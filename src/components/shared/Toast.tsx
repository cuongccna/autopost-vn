'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  style?: React.CSSProperties;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (_id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        onRemoveToast(toast.id);
      }, toast.duration || 5000); // Use custom duration or default 5000ms
      return () => clearTimeout(timer);
    });
  }, [toasts, onRemoveToast]);

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`rounded-xl border p-4 shadow-lg animate-in slide-in-from-right-full duration-300 ${getToastStyles(toast.type)}`}
          style={toast.style}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{getIcon(toast.type)}</span>
              <span 
                className="text-sm font-medium"
                style={{ whiteSpace: toast.style?.whiteSpace as any }}
              >
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => onRemoveToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info', options?: { duration?: number; style?: React.CSSProperties }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { 
      id, 
      message, 
      type,
      duration: options?.duration,
      style: options?.style
    }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message: string, options?: { duration?: number; style?: React.CSSProperties }) => addToast(message, 'success', options),
    error: (message: string, options?: { duration?: number; style?: React.CSSProperties }) => addToast(message, 'error', options),
    warning: (message: string, options?: { duration?: number; style?: React.CSSProperties }) => addToast(message, 'warning', options),
    info: (message: string, options?: { duration?: number; style?: React.CSSProperties }) => addToast(message, 'info', options),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}
