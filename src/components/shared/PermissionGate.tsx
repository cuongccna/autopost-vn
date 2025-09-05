'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { FeaturePermissions, UserRole } from '@/lib/constants/permissions';
import { Lock, Crown, Zap } from 'lucide-react';

interface PermissionGateProps {
  feature: keyof FeaturePermissions;
  subFeature?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface UpgradePromptProps {
  feature: string;
  title: string;
  description: string;
  targetRole?: UserRole;
}

function UpgradePrompt({ feature, title, description, targetRole = 'professional' }: UpgradePromptProps) {
  const { getUpgradeMsg } = usePermissions();
  const upgradeMessage = getUpgradeMsg(feature, targetRole);
  
  const getIcon = () => {
    switch (targetRole) {
      case 'professional':
        return <Crown className="w-6 h-6 text-blue-600" />;
      case 'enterprise':
        return <Zap className="w-6 h-6 text-purple-600" />;
      default:
        return <Lock className="w-6 h-6 text-gray-600" />;
    }
  };
  
  const getColors = () => {
    switch (targetRole) {
      case 'professional':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-900',
          subtext: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'enterprise':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
          border: 'border-purple-200',
          text: 'text-purple-900',
          subtext: 'text-purple-700',
          button: 'bg-purple-600 hover:bg-purple-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-900',
          subtext: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6 text-center`}>
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      
      <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
        {title}
      </h3>
      
      <p className={`text-sm ${colors.subtext} mb-4`}>
        {description}
      </p>
      
      <div className={`text-xs ${colors.subtext} mb-4 p-3 bg-white rounded-lg border`}>
        {upgradeMessage}
      </div>
      
      <button 
        className={`w-full ${colors.button} text-white py-3 px-6 rounded-lg font-medium transition-colors`}
        onClick={() => {
          // TODO: Navigate to upgrade page
          console.log('Navigate to upgrade page for:', targetRole);
        }}
      >
        Nâng cấp ngay
      </button>
    </div>
  );
}

export default function PermissionGate({ 
  feature, 
  subFeature, 
  fallback, 
  children 
}: PermissionGateProps) {
  const { hasFeature, isLoading } = usePermissions();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const hasPermission = hasFeature(feature, subFeature);
  
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback with upgrade prompt
    const getFeatureInfo = () => {
      switch (feature) {
        case 'scheduling':
          if (subFeature === 'aiOptimized') {
            return {
              title: 'Lên lịch thông minh với AI',
              description: 'Tối ưu thời gian đăng bài tự động với AI để có nhiều tương tác nhất',
            };
          }
          return {
            title: 'Tính năng lên lịch',
            description: 'Lên lịch đăng bài tự động theo thời gian bạn muốn',
          };
        case 'analytics':
          if (subFeature === 'advanced') {
            return {
              title: 'Báo cáo nâng cao',
              description: 'Phân tích chi tiết hiệu suất bài viết với đầy đủ metrics',
            };
          }
          if (subFeature === 'pdfExport') {
            return {
              title: 'Xuất báo cáo PDF',
              description: 'Xuất báo cáo chuyên nghiệp dưới dạng PDF để chia sẻ',
            };
          }
          return {
            title: 'Báo cáo & phân tích',
            description: 'Theo dõi hiệu suất bài viết và tăng trưởng',
          };
        case 'templates':
          return {
            title: 'Templates không giới hạn',
            description: 'Truy cập toàn bộ thư viện mẫu nội dung chuyên nghiệp',
          };
        case 'ai':
          return {
            title: 'Tính năng AI Premium',
            description: 'Sử dụng AI để tạo nội dung và hashtag tự động',
          };
        default:
          return {
            title: 'Tính năng Premium',
            description: 'Tính năng này yêu cầu gói cao hơn',
          };
      }
    };
    
    const featureInfo = getFeatureInfo();
    
    return (
      <UpgradePrompt
        feature={feature}
        title={featureInfo.title}
        description={featureInfo.description}
        targetRole="professional"
      />
    );
  }
  
  return <>{children}</>;
}
