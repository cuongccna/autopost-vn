'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Database, Download, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

export default function DataSettings() {
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      toast.info('Đang xuất dữ liệu...');

      const response = await fetch(`/api/user/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autopostvn-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Đã xuất dữ liệu dạng ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Không thể xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== session?.user?.email) {
      toast.error('Email xác nhận không khớp');
      return;
    }

    if (!confirm('Bạn có CHẮC CHẮN muốn xóa tài khoản? Hành động này KHÔNG THỂ HOÀN TÁC!')) {
      return;
    }

    try {
      setIsDeleting(true);
      toast.info('Đang xóa tài khoản...');

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Tài khoản đã được xóa');
      
      // Sign out and redirect
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 2000);

    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Không thể xóa tài khoản');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Database className="w-5 h-5" />
        <span>Dữ liệu & Tài khoản</span>
      </h2>

      <div className="space-y-6">
        {/* Export Data */}
        <div>
          <h3 className="font-medium mb-2">Xuất dữ liệu</h3>
          <p className="text-sm text-gray-500 mb-3">
            Tải xuống toàn bộ dữ liệu của bạn bao gồm bài đăng, tài khoản mạng xã hội và nhật ký hoạt động
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExportData('json')}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Xuất JSON</span>
            </button>
            <button
              onClick={() => handleExportData('csv')}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="border-t pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Vùng nguy hiểm</h3>
                <p className="text-sm text-red-700 mt-1">
                  Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn. Hành động này không thể hoàn tác.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa tài khoản</span>
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">
                      Nhập email của bạn để xác nhận: <strong>{session?.user?.email}</strong>
                    </p>
                    <input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="Nhập email để xác nhận"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || confirmEmail !== session?.user?.email}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setConfirmEmail('');
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Lưu ý:</strong> Trước khi xóa tài khoản, hãy chắc chắn bạn đã xuất và sao lưu 
            toàn bộ dữ liệu quan trọng. Sau khi xóa, bạn sẽ không thể khôi phục lại.
          </p>
        </div>
      </div>
    </div>
  );
}
