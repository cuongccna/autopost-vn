'use client';

import { useState } from 'react';
import { X, Copy, Check, CreditCard } from 'lucide-react';
import { showToast } from '@/lib/utils/toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    type: 'professional' | 'enterprise';
  };
  onRequestUpgrade: (planType: 'professional' | 'enterprise') => Promise<void>;
}

export default function PaymentModal({ isOpen, onClose, plan, onRequestUpgrade }: PaymentModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const bankInfo = {
    bank: 'Sacombank',
    branch: 'Trung Tâm',
    accountName: 'Ngo Van Cuong',
    accountNumber: '060234545054',
    amount: plan.type === 'professional' ? '299,000đ' : '999,000đ',
    content: 'autopostVn Nang Cap Goi'
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    showToast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRequestUpgrade(plan.type);
      showToast.success('Yêu cầu nâng cấp đã được gửi! Admin sẽ xác nhận trong 1-24h.');
      onClose();
    } catch (error) {
      console.error('Upgrade request failed:', error);
      showToast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Nâng cấp lên {plan.name}
          </h2>
          <p className="text-gray-600 mt-2">
            Chuyển khoản theo thông tin bên dưới
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            📋 Thông tin chuyển khoản
          </h3>
          
          <div className="space-y-3">
            {/* Bank Name */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Ngân hàng</p>
                  <p className="text-lg font-semibold text-gray-800">{bankInfo.bank}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.bank, 'Tên ngân hàng')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'Tên ngân hàng' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Branch */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Chi nhánh</p>
                  <p className="text-lg font-semibold text-gray-800">{bankInfo.branch}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.branch, 'Chi nhánh')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'Chi nhánh' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Tên tài khoản</p>
                  <p className="text-lg font-semibold text-gray-800">{bankInfo.accountName}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.accountName, 'Tên tài khoản')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'Tên tài khoản' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Number */}
            <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Số tài khoản</p>
                  <p className="text-xl font-bold text-purple-600">{bankInfo.accountNumber}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.accountNumber, 'Số tài khoản')}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  {copied === 'Số tài khoản' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-purple-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-white rounded-lg p-4 border-2 border-indigo-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Số tiền</p>
                  <p className="text-2xl font-bold text-indigo-600">{bankInfo.amount}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.amount, 'Số tiền')}
                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  {copied === 'Số tiền' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-indigo-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Transfer Content */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Nội dung chuyển khoản</p>
                  <p className="text-lg font-bold text-green-600">{bankInfo.content}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankInfo.content, 'Nội dung')}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  {copied === 'Nội dung' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-green-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-amber-800 mb-2">📌 Hướng dẫn:</h4>
          <ol className="text-sm text-amber-900 space-y-1 list-decimal list-inside">
            <li>Chuyển khoản theo đúng thông tin bên trên</li>
            <li>Nhập chính xác <strong>Nội dung chuyển khoản</strong></li>
            <li>Nhấn nút &ldquo;Gửi yêu cầu nâng cấp&rdquo; bên dưới</li>
            <li>Admin sẽ xác nhận và kích hoạt tài khoản trong <strong>1-24 giờ</strong></li>
            <li>Bạn sẽ nhận email xác nhận khi tài khoản được kích hoạt</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu nâng cấp'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Mọi thắc mắc vui lòng liên hệ: <a href="mailto:cuong.vhcc@gmail.com" className="text-purple-600 hover:underline">cuong.vhcc@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
