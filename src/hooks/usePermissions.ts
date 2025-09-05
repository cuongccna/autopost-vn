'use client';

import { useSession } from 'next-auth/react';
import { 
  UserRole, 
  FeaturePermissions, 
  ROLE_PERMISSIONS, 
  hasPermission, 
  getFeatureLimit, 
  getUpgradeMessage 
} from '@/lib/constants/permissions';

interface UsePermissionsReturn {
  userRole: UserRole;
  permissions: FeaturePermissions;
  hasFeature: (feature: keyof FeaturePermissions, subFeature?: string) => boolean;
  getLimit: (feature: keyof FeaturePermissions, limitType: string) => number;
  getUpgradeMsg: (feature: string, targetRole?: UserRole) => string;
  isLoading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  
  // Get user role from session, default to 'free'
  const userRole: UserRole = (session?.user as any)?.role || 'free';
  const permissions = ROLE_PERMISSIONS[userRole];
  const isLoading = status === 'loading';

  const hasFeature = (
    feature: keyof FeaturePermissions, 
    subFeature?: string
  ): boolean => {
    return hasPermission(userRole, feature, subFeature);
  };

  const getLimit = (
    feature: keyof FeaturePermissions, 
    limitType: string
  ): number => {
    return getFeatureLimit(userRole, feature, limitType);
  };

  const getUpgradeMsg = (
    feature: string, 
    targetRole: UserRole = 'professional'
  ): string => {
    return getUpgradeMessage(userRole, feature, targetRole);
  };

  return {
    userRole,
    permissions,
    hasFeature,
    getLimit,
    getUpgradeMsg,
    isLoading,
  };
}
