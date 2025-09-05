'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/constants/permissions';
import { Crown, Zap } from 'lucide-react';

interface RoleBadgeProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoleBadge({ className = '', showLabel = true, size = 'md' }: RoleBadgeProps) {
  const { userRole, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full ${
        size === 'sm' ? 'h-5 w-12' : size === 'lg' ? 'h-8 w-20' : 'h-6 w-16'
      } ${className}`} />
    );
  }

  const getRoleConfig = () => {
    switch (userRole) {
      case 'free':
        return {
          label: ROLE_LABELS.free,
          icon: ROLE_ICONS.free,
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          iconComponent: null,
        };
      case 'professional':
        return {
          label: ROLE_LABELS.professional,
          icon: ROLE_ICONS.professional,
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
          iconComponent: <Crown className="w-3 h-3" />,
        };
      case 'enterprise':
        return {
          label: ROLE_LABELS.enterprise,
          icon: ROLE_ICONS.enterprise,
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-200',
          iconComponent: <Zap className="w-3 h-3" />,
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
          iconComponent: null,
        };
    }
  };

  const config = getRoleConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border font-medium ${
      config.bg
    } ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}>
      {config.iconComponent || <span>{config.icon}</span>}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
