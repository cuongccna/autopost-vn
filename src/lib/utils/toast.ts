// Simple toast notification utility
// Can be replaced with a library like sonner or react-hot-toast later

type ToastType = 'success' | 'error' | 'info' | 'warning';

class Toast {
  private container: HTMLDivElement | null = null;

  private init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  }

  private show(message: string, type: ToastType, duration = 3000) {
    this.init();
    
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
    };
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };
    
    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px] animate-slide-in`;
    toast.innerHTML = `
      <span class="text-lg font-bold">${icons[type]}</span>
      <span>${message}</span>
    `;
    
    this.container?.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(400px)';
      toast.style.transition = 'all 0.3s ease-out';
      
      setTimeout(() => {
        this.container?.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }
}

export const toast = new Toast();
export const showToast = toast;
