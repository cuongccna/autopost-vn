import { describe, it, expect } from '@jest/globals';
import { 
  hasPermission, 
  getFeatureLimit, 
  getUpgradeMessage,
  ROLE_PERMISSIONS 
} from '@/lib/constants/permissions';

describe('Permission System', () => {
  describe('ROLE_PERMISSIONS constants', () => {
    it('should have correct permissions for free role', () => {
      const freePermissions = ROLE_PERMISSIONS.free;
      
      expect(freePermissions.scheduling.basic).toBe(true);
      expect(freePermissions.scheduling.aiOptimized).toBe(false);
      
      expect(freePermissions.analytics.basic).toBe(true);
      expect(freePermissions.analytics.advanced).toBe(false);
      expect(freePermissions.analytics.pdfExport).toBe(false);
      
      expect(freePermissions.templates.basicCount).toBe(3);
      expect(freePermissions.templates.customTemplates).toBe(false);
      
      expect(freePermissions.posts.monthlyLimit).toBe(10);
      
      expect(freePermissions.ai.dailyLimit).toBe(2);
      expect(freePermissions.ai.monthlyLimit).toBe(60);
    });

    it('should have correct permissions for professional role', () => {
      const proPermissions = ROLE_PERMISSIONS.professional;
      
      expect(proPermissions.scheduling.basic).toBe(true);
      expect(proPermissions.scheduling.aiOptimized).toBe(true);
      
      expect(proPermissions.analytics.basic).toBe(true);
      expect(proPermissions.analytics.advanced).toBe(true);
      expect(proPermissions.analytics.pdfExport).toBe(true);
      
      expect(proPermissions.templates.basicCount).toBe(-1); // unlimited
      expect(proPermissions.templates.customTemplates).toBe(true);
      
      expect(proPermissions.posts.monthlyLimit).toBe(-1); // unlimited
      
      expect(proPermissions.ai.dailyLimit).toBe(20);
      expect(proPermissions.ai.monthlyLimit).toBe(600);
    });

    it('should have correct permissions for enterprise role', () => {
      const enterprisePermissions = ROLE_PERMISSIONS.enterprise;
      
      expect(enterprisePermissions.scheduling.basic).toBe(true);
      expect(enterprisePermissions.scheduling.aiOptimized).toBe(true);
      
      expect(enterprisePermissions.analytics.basic).toBe(true);
      expect(enterprisePermissions.analytics.advanced).toBe(true);
      expect(enterprisePermissions.analytics.pdfExport).toBe(true);
      
      expect(enterprisePermissions.templates.basicCount).toBe(-1); // unlimited
      expect(enterprisePermissions.templates.customTemplates).toBe(true);
      
      expect(enterprisePermissions.posts.monthlyLimit).toBe(-1); // unlimited
      
      expect(enterprisePermissions.ai.dailyLimit).toBe(-1); // unlimited
      expect(enterprisePermissions.ai.monthlyLimit).toBe(-1); // unlimited
    });
  });

  describe('hasPermission function', () => {
    it('should return true for basic scheduling for all roles', () => {
      expect(hasPermission('free', 'scheduling', 'basic')).toBe(true);
      expect(hasPermission('professional', 'scheduling', 'basic')).toBe(true);
      expect(hasPermission('enterprise', 'scheduling', 'basic')).toBe(true);
    });

    it('should return false for AI scheduling for free users', () => {
      expect(hasPermission('free', 'scheduling', 'aiOptimized')).toBe(false);
    });

    it('should return true for AI scheduling for premium users', () => {
      expect(hasPermission('professional', 'scheduling', 'aiOptimized')).toBe(true);
      expect(hasPermission('enterprise', 'scheduling', 'aiOptimized')).toBe(true);
    });

    it('should return false for advanced analytics for free users', () => {
      expect(hasPermission('free', 'analytics', 'advanced')).toBe(false);
      expect(hasPermission('free', 'analytics', 'pdfExport')).toBe(false);
    });

    it('should return true for advanced analytics for premium users', () => {
      expect(hasPermission('professional', 'analytics', 'advanced')).toBe(true);
      expect(hasPermission('professional', 'analytics', 'pdfExport')).toBe(true);
      
      expect(hasPermission('enterprise', 'analytics', 'advanced')).toBe(true);
      expect(hasPermission('enterprise', 'analytics', 'pdfExport')).toBe(true);
    });

    it('should return false for custom templates for free users', () => {
      expect(hasPermission('free', 'templates', 'customTemplates')).toBe(false);
    });

    it('should return true for custom templates for premium users', () => {
      expect(hasPermission('professional', 'templates', 'customTemplates')).toBe(true);
      expect(hasPermission('enterprise', 'templates', 'customTemplates')).toBe(true);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid' as any, 'scheduling', 'basic')).toBe(false);
    });

    it('should return false for invalid feature', () => {
      expect(hasPermission('free', 'invalid' as any, 'basic')).toBe(false);
    });

    it('should return true when checking feature without subFeature', () => {
      expect(hasPermission('free', 'scheduling')).toBe(true);
      expect(hasPermission('free', 'analytics')).toBe(true);
    });
  });

  describe('getFeatureLimit function', () => {
    it('should return correct template limits', () => {
      expect(getFeatureLimit('free', 'templates', 'basicCount')).toBe(3);
      expect(getFeatureLimit('professional', 'templates', 'basicCount')).toBe(-1);
      expect(getFeatureLimit('enterprise', 'templates', 'basicCount')).toBe(-1);
    });

    it('should return correct post limits', () => {
      expect(getFeatureLimit('free', 'posts', 'monthlyLimit')).toBe(10);
      expect(getFeatureLimit('professional', 'posts', 'monthlyLimit')).toBe(-1);
      expect(getFeatureLimit('enterprise', 'posts', 'monthlyLimit')).toBe(-1);
    });

    it('should return correct AI limits', () => {
      expect(getFeatureLimit('free', 'ai', 'dailyLimit')).toBe(2);
      expect(getFeatureLimit('free', 'ai', 'monthlyLimit')).toBe(60);
      
      expect(getFeatureLimit('professional', 'ai', 'dailyLimit')).toBe(20);
      expect(getFeatureLimit('professional', 'ai', 'monthlyLimit')).toBe(600);
      
      expect(getFeatureLimit('enterprise', 'ai', 'dailyLimit')).toBe(-1);
      expect(getFeatureLimit('enterprise', 'ai', 'monthlyLimit')).toBe(-1);
    });

    it('should return 0 for invalid parameters', () => {
      expect(getFeatureLimit('invalid' as any, 'ai', 'dailyLimit')).toBe(0);
      expect(getFeatureLimit('free', 'invalid' as any, 'dailyLimit')).toBe(0);
      expect(getFeatureLimit('free', 'ai', 'invalidLimit')).toBe(0);
    });
  });

  describe('getUpgradeMessage function', () => {
    it('should return appropriate scheduling upgrade message', () => {
      const message = getUpgradeMessage('free', 'scheduling', 'professional');
      
      expect(message).toContain('Professional');
      expect(message).toContain('lên lịch thông minh với AI');
      expect(message).toContain('299k/tháng');
    });

    it('should return appropriate analytics upgrade message', () => {
      const message = getUpgradeMessage('free', 'analytics', 'professional');
      
      expect(message).toContain('Professional');
      expect(message).toContain('báo cáo nâng cao và xuất PDF');
      expect(message).toContain('299k/tháng');
    });

    it('should return appropriate templates upgrade message', () => {
      const message = getUpgradeMessage('free', 'templates', 'professional');
      
      expect(message).toContain('Professional');
      expect(message).toContain('không giới hạn templates');
      expect(message).toContain('299k/tháng');
    });

    it('should return appropriate AI upgrade message', () => {
      const message = getUpgradeMessage('free', 'ai', 'professional');
      
      expect(message).toContain('Professional');
      expect(message).toContain('thêm AI requests');
      expect(message).toContain('299k/tháng');
    });

    it('should return enterprise upgrade message', () => {
      const message = getUpgradeMessage('professional', 'ai', 'enterprise');
      
      expect(message).toContain('Enterprise');
      expect(message).toContain('999k/tháng');
    });

    it('should return default message for unknown feature', () => {
      const message = getUpgradeMessage('free', 'unknown', 'professional');
      
      expect(message).toContain('Professional');
      expect(message).toContain('mở khóa tính năng này');
    });

    it('should handle free role target gracefully', () => {
      const message = getUpgradeMessage('professional', 'ai', 'free');
      
      expect(message).toBe('Bạn đã ở gói miễn phí');
    });

    it('should default to professional when no target role specified', () => {
      const message = getUpgradeMessage('free', 'ai');
      
      expect(message).toContain('Professional');
      expect(message).toContain('299k/tháng');
    });
  });

  describe('Role progression logic', () => {
    it('should show correct upgrade path from free to professional', () => {
      // Free user should be encouraged to upgrade to Professional
      const schedulingMessage = getUpgradeMessage('free', 'scheduling');
      const analyticsMessage = getUpgradeMessage('free', 'analytics');
      
      expect(schedulingMessage).toContain('Professional');
      expect(analyticsMessage).toContain('Professional');
    });

    it('should show correct upgrade path from professional to enterprise', () => {
      // Professional user hitting AI limits should be encouraged to upgrade to Enterprise
      const aiMessage = getUpgradeMessage('professional', 'ai', 'enterprise');
      
      expect(aiMessage).toContain('Enterprise');
      expect(aiMessage).toContain('999k/tháng');
    });

    it('should provide clear value propositions', () => {
      const freeToProMessage = getUpgradeMessage('free', 'ai');
      const proToEnterpriseMessage = getUpgradeMessage('professional', 'ai', 'enterprise');
      
      // Free to Pro should mention specific limits
      expect(freeToProMessage).toContain('299k');
      
      // Pro to Enterprise should mention unlimited
      expect(proToEnterpriseMessage).toContain('999k');
    });
  });

  describe('Feature availability matrix', () => {
    const features = [
      { feature: 'scheduling', subFeature: 'basic', free: true, pro: true, enterprise: true },
      { feature: 'scheduling', subFeature: 'aiOptimized', free: false, pro: true, enterprise: true },
      { feature: 'analytics', subFeature: 'basic', free: true, pro: true, enterprise: true },
      { feature: 'analytics', subFeature: 'advanced', free: false, pro: true, enterprise: true },
      { feature: 'analytics', subFeature: 'pdfExport', free: false, pro: true, enterprise: true },
      { feature: 'templates', subFeature: 'customTemplates', free: false, pro: true, enterprise: true },
    ];

    features.forEach(({ feature, subFeature, free, pro, enterprise }) => {
      it(`should have correct permissions for ${feature}.${subFeature}`, () => {
        expect(hasPermission('free', feature as any, subFeature)).toBe(free);
        expect(hasPermission('professional', feature as any, subFeature)).toBe(pro);
        expect(hasPermission('enterprise', feature as any, subFeature)).toBe(enterprise);
      });
    });
  });
});
