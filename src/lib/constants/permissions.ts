export type UserRole = 'free' | 'professional' | 'enterprise';

export interface FeaturePermissions {
  scheduling: {
    basic: boolean;
    aiOptimized: boolean;
  };
  analytics: {
    basic: boolean;
    advanced: boolean;
    pdfExport: boolean;
  };
  templates: {
    basicCount: number; // -1 means unlimited
    customTemplates: boolean;
    advancedTemplates: boolean;
  };
  posts: {
    monthlyLimit: number; // -1 means unlimited
  };
  ai: {
    dailyLimit: number; // -1 means unlimited
    monthlyLimit: number; // -1 means unlimited
  };
}

export const ROLE_PERMISSIONS: Record<UserRole, FeaturePermissions> = {
  free: {
    scheduling: {
      basic: true,
      aiOptimized: false,
    },
    analytics: {
      basic: true,
      advanced: false,
      pdfExport: false,
    },
    templates: {
      basicCount: 3,
      customTemplates: false,
      advancedTemplates: false,
    },
    posts: {
      monthlyLimit: 10,
    },
    ai: {
      dailyLimit: 2,
      monthlyLimit: 60,
    },
  },
  professional: {
    scheduling: {
      basic: true,
      aiOptimized: true,
    },
    analytics: {
      basic: true,
      advanced: true,
      pdfExport: true,
    },
    templates: {
      basicCount: -1, // unlimited
      customTemplates: true,
      advancedTemplates: true,
    },
    posts: {
      monthlyLimit: -1, // unlimited
    },
    ai: {
      dailyLimit: 20,
      monthlyLimit: 600,
    },
  },
  enterprise: {
    scheduling: {
      basic: true,
      aiOptimized: true,
    },
    analytics: {
      basic: true,
      advanced: true,
      pdfExport: true,
    },
    templates: {
      basicCount: -1, // unlimited
      customTemplates: true,
      advancedTemplates: true,
    },
    posts: {
      monthlyLimit: -1, // unlimited
    },
    ai: {
      dailyLimit: -1, // unlimited
      monthlyLimit: -1, // unlimited
    },
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  free: 'Miễn phí',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  free: '🆓',
  professional: '⭐',
  enterprise: '💎',
};

export const UPGRADE_PRICING = {
  professional: {
    price: '299k',
    period: 'tháng',
    features: [
      'Lên lịch thông minh với AI',
      'Báo cáo nâng cao + xuất PDF',
      'Không giới hạn templates',
      'Không giới hạn bài đăng',
      '20 AI requests/ngày',
    ],
  },
  enterprise: {
    price: '999k',
    period: 'tháng',
    features: [
      'Tất cả tính năng Professional',
      'Không giới hạn AI requests',
      'API Access',
      'Tích hợp tùy chỉnh',
      'Account Manager riêng',
    ],
  },
};

/**
 * Check if user has permission for a specific feature
 */
export function hasPermission(
  userRole: UserRole,
  feature: keyof FeaturePermissions,
  subFeature?: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions || !permissions[feature]) {
    return false;
  }
  
  const featurePermissions = permissions[feature] as any;
  
  if (subFeature) {
    return featurePermissions[subFeature] === true;
  }
  
  return true;
}

/**
 * Get feature limits for user role
 */
export function getFeatureLimit(
  userRole: UserRole,
  feature: keyof FeaturePermissions,
  limitType: string
): number {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions || !permissions[feature]) {
    return 0;
  }
  
  const featurePermissions = permissions[feature] as any;
  return featurePermissions[limitType] || 0;
}

/**
 * Get upgrade message for feature limitation
 */
export function getUpgradeMessage(
  currentRole: UserRole,
  feature: string,
  targetRole: UserRole = 'professional'
): string {
  // Handle free role case
  if (targetRole === 'free') {
    return 'Bạn đã ở gói miễn phí';
  }
  
  const pricing = UPGRADE_PRICING[targetRole as 'professional' | 'enterprise'];
  
  const messages: Record<string, string> = {
    scheduling: `Nâng cấp lên ${ROLE_LABELS[targetRole]} để sử dụng lên lịch thông minh với AI chỉ ${pricing.price}/${pricing.period}`,
    analytics: `Nâng cấp lên ${ROLE_LABELS[targetRole]} để có báo cáo nâng cao và xuất PDF chỉ ${pricing.price}/${pricing.period}`,
    templates: `Nâng cấp lên ${ROLE_LABELS[targetRole]} để không giới hạn templates chỉ ${pricing.price}/${pricing.period}`,
    posts: `Nâng cấp lên ${ROLE_LABELS[targetRole]} để không giới hạn bài đăng chỉ ${pricing.price}/${pricing.period}`,
    ai: `Nâng cấp lên ${ROLE_LABELS[targetRole]} để có thêm AI requests chỉ ${pricing.price}/${pricing.period}`,
  };
  
  return messages[feature] || `Nâng cấp lên ${ROLE_LABELS[targetRole]} để mở khóa tính năng này`;
}
