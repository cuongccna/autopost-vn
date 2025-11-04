import { isShadowbanHashtag, getShadowbanStatus } from '../data/shadowban-hashtags';

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'zalo';

export type ValidationLevel = 'valid' | 'warning' | 'error';

export interface HashtagValidation {
  hashtag: string;
  isValid: boolean;
  level: ValidationLevel;
  issues: string[];
  suggestions: string[];
  metadata?: {
    length?: number;
    isShadowban?: boolean;
    shadowbanSeverity?: 'high' | 'medium' | 'low';
    competitionLevel?: 'low' | 'medium' | 'high';
  };
}

export interface PlatformConfig {
  name: string;
  hashtagSupport: 'full' | 'limited' | 'none';
  recommendedCount: { min: number; max: number };
  maxHashtagLength: number;
  maxHashtagsPerPost: number;
  guidelines: string[];
}

/**
 * Platform-specific configurations
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    hashtagSupport: 'full',
    recommendedCount: { min: 9, max: 15 },
    maxHashtagLength: 30,
    maxHashtagsPerPost: 30,
    guidelines: [
      'Use 9-15 hashtags for optimal reach',
      'Mix popular (30%) and niche (70%) hashtags',
      'Place hashtags in first comment for cleaner look',
      'Avoid banned hashtags to prevent shadowban',
      'Location-based hashtags increase local reach'
    ]
  },
  facebook: {
    name: 'Facebook',
    hashtagSupport: 'limited',
    recommendedCount: { min: 1, max: 3 },
    maxHashtagLength: 50,
    maxHashtagsPerPost: 5, // Technical limit higher, but not recommended
    guidelines: [
      'Use 1-3 hashtags maximum',
      'Focus on branded hashtags (#YourBrand)',
      'Hashtags have minimal impact on reach',
      'Better to focus on engaging content',
      'Use for campaign tracking, not discovery'
    ]
  },
  tiktok: {
    name: 'TikTok',
    hashtagSupport: 'full',
    recommendedCount: { min: 3, max: 5 },
    maxHashtagLength: 40,
    maxHashtagsPerPost: 10,
    guidelines: [
      'Use 3-5 trending hashtags',
      'Mix trending + niche hashtags',
      'Include #ForYou or #FYP for discovery',
      'Stay updated with trending challenges',
      'Hashtags heavily influence algorithm'
    ]
  },
  zalo: {
    name: 'Zalo',
    hashtagSupport: 'none',
    recommendedCount: { min: 0, max: 0 },
    maxHashtagLength: 0,
    maxHashtagsPerPost: 0,
    guidelines: [
      'Zalo does not support hashtag discovery',
      'Focus on clear, direct messaging',
      'Use @ mentions for engagement',
      'Business tone recommended',
      'Links and CTAs work better than hashtags'
    ]
  }
};

/**
 * Validate a single hashtag
 */
export function validateHashtag(
  hashtag: string,
  platform: Platform
): HashtagValidation {
  const config = PLATFORM_CONFIGS[platform];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let level: ValidationLevel = 'valid';
  
  // Remove # if present for validation
  const cleanHashtag = hashtag.replace('#', '');
  
  // 1. Platform support check
  if (config.hashtagSupport === 'none') {
    issues.push(`${config.name} không hỗ trợ hashtag discovery`);
    suggestions.push('Xóa tất cả hashtags cho platform này');
    level = 'warning';
  }
  
  if (config.hashtagSupport === 'limited') {
    issues.push(`Hashtags có hiệu quả hạn chế trên ${config.name}`);
    suggestions.push(`Nên dùng ${config.recommendedCount.min}-${config.recommendedCount.max} hashtags`);
    level = 'warning';
  }
  
  // 2. Format validation
  if (!cleanHashtag || cleanHashtag.trim().length === 0) {
    issues.push('Hashtag rỗng');
    level = 'error';
    return {
      hashtag,
      isValid: false,
      level,
      issues,
      suggestions,
      metadata: { length: 0 }
    };
  }
  
  // 3. Character validation
  const invalidChars = /[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g; // Allow Vietnamese
  if (invalidChars.test(cleanHashtag)) {
    issues.push('Hashtag chứa ký tự không hợp lệ (chỉ cho phép chữ, số, _)');
    const cleanedVersion = cleanHashtag.replace(invalidChars, '');
    suggestions.push(`Thử: #${cleanedVersion}`);
    level = 'error';
  }
  
  // 4. Length validation
  if (cleanHashtag.length > config.maxHashtagLength) {
    issues.push(`Hashtag quá dài (max: ${config.maxHashtagLength} ký tự)`);
    const shortened = cleanHashtag.substring(0, config.maxHashtagLength);
    suggestions.push(`Rút ngắn thành: #${shortened}`);
    level = 'error';
  }
  
  // 5. Space check
  if (cleanHashtag.includes(' ')) {
    issues.push('Hashtag không được chứa khoảng trắng');
    const fixed = cleanHashtag.replace(/\s+/g, '');
    suggestions.push(`Thử: #${fixed}`);
    level = 'error';
  }
  
  // 6. Shadowban check (Instagram only)
  if (platform === 'instagram') {
    const shadowbanStatus = getShadowbanStatus(hashtag);
    if (shadowbanStatus.isBanned) {
      issues.push(`⚠️ Shadowban risk: ${shadowbanStatus.reason}`);
      suggestions.push('Xóa hashtag này để tránh bị ẩn bài');
      level = shadowbanStatus.severity === 'high' ? 'error' : 'warning';
      
      return {
        hashtag,
        isValid: false,
        level,
        issues,
        suggestions,
        metadata: {
          length: cleanHashtag.length,
          isShadowban: true,
          shadowbanSeverity: shadowbanStatus.severity
        }
      };
    }
  }
  
  // 7. Generic/spam pattern check
  const spamPatterns = ['follow', 'like', 'tag', 'gain', 'free', 'win', 'giveaway'];
  const isGeneric = spamPatterns.some(pattern => 
    cleanHashtag.toLowerCase().includes(pattern)
  );
  
  if (isGeneric && level === 'valid') {
    issues.push('Hashtag có vẻ generic, có thể giảm hiệu quả');
    suggestions.push('Thử hashtag cụ thể hơn liên quan đến nội dung');
    level = 'warning';
  }
  
  // Success case
  const isValid = level !== 'error';
  
  return {
    hashtag,
    isValid,
    level,
    issues,
    suggestions,
    metadata: {
      length: cleanHashtag.length,
      isShadowban: false
    }
  };
}

/**
 * Validate multiple hashtags for a platform
 */
export function validateHashtags(
  hashtags: string[],
  platform: Platform
): {
  validations: HashtagValidation[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    platformWarning?: string;
  };
} {
  const config = PLATFORM_CONFIGS[platform];
  const validations = hashtags.map(tag => validateHashtag(tag, platform));
  
  const summary = {
    total: hashtags.length,
    valid: validations.filter(v => v.level === 'valid').length,
    warnings: validations.filter(v => v.level === 'warning').length,
    errors: validations.filter(v => v.level === 'error').length,
    platformWarning: undefined as string | undefined
  };
  
  // Platform-specific warnings
  if (hashtags.length > config.recommendedCount.max) {
    summary.platformWarning = `${config.name}: Đề xuất dùng ${config.recommendedCount.min}-${config.recommendedCount.max} hashtags. Hiện tại: ${hashtags.length}`;
  }
  
  if (hashtags.length > config.maxHashtagsPerPost) {
    summary.platformWarning = `${config.name}: Vượt quá giới hạn ${config.maxHashtagsPerPost} hashtags!`;
  }
  
  if (config.hashtagSupport === 'none' && hashtags.length > 0) {
    summary.platformWarning = `${config.name} không hỗ trợ hashtag discovery. Nên xóa tất cả hashtags.`;
  }
  
  if (config.hashtagSupport === 'limited' && hashtags.length > config.recommendedCount.max) {
    summary.platformWarning = `${config.name}: Hashtags có hiệu quả hạn chế. Nên dùng tối đa ${config.recommendedCount.max} hashtags.`;
  }
  
  return {
    validations,
    summary
  };
}

/**
 * Get platform-specific recommendations
 */
export function getPlatformRecommendations(platform: Platform): string[] {
  return PLATFORM_CONFIGS[platform].guidelines;
}

/**
 * Sanitize hashtag (remove invalid characters, normalize)
 */
export function sanitizeHashtag(hashtag: string): string {
  let clean = hashtag.trim();
  
  // Remove # if present
  clean = clean.replace(/^#+/, '');
  
  // Remove spaces
  clean = clean.replace(/\s+/g, '');
  
  // Remove invalid characters (keep Vietnamese)
  clean = clean.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '');
  
  // Add # prefix
  return `#${clean}`;
}

/**
 * Get better hashtag alternatives (basic suggestions)
 */
export function suggestAlternatives(hashtag: string, category?: string): string[] {
  const clean = hashtag.replace('#', '').toLowerCase();
  const suggestions: string[] = [];
  
  // If it's a shadowban hashtag, suggest removing it
  if (isShadowbanHashtag(hashtag)) {
    return [`Remove ${hashtag} - shadowban risk`];
  }
  
  // Generic suggestions based on common patterns
  if (clean.includes('sale')) {
    suggestions.push('#salevietnam', '#salesaigon', '#salehanoi', '#flashsale');
  }
  
  if (clean.includes('food')) {
    suggestions.push('#foodvietnam', '#vietnamesefood', '#foodiesaigon', '#anuongsg');
  }
  
  if (clean.includes('fashion')) {
    suggestions.push('#fashionvietnam', '#vietnamesefashion', '#thoitrangvietnam');
  }
  
  // Category-based suggestions
  if (category) {
    suggestions.push(`#${category}vietnam`, `#${category}saigon`);
  }
  
  // Add location variations
  if (!clean.includes('vietnam') && !clean.includes('viet')) {
    suggestions.push(`#${clean}vietnam`);
  }
  
  return suggestions.slice(0, 3); // Return top 3
}
