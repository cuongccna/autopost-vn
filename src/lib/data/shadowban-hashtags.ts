/**
 * Instagram Shadowban Hashtags
 * Updated: November 2025
 * Source: Community reports + Instagram policy violations
 * 
 * These hashtags may cause your posts to be hidden from hashtag search results
 */

export const SHADOWBAN_HASHTAGS = new Set([
  // Engagement pods / Follow schemes
  '#follow4follow',
  '#f4f',
  '#followforfollow',
  '#followback',
  '#followme',
  '#like4like',
  '#l4l',
  '#likeforlike',
  '#likeback',
  '#tagsforlikes',
  '#tflers',
  '#followtrick',
  '#followalways',
  '#follow4followback',
  '#follownow',
  '#followher',
  '#followhim',
  '#followall',
  '#followbackteam',
  '#teamfollowback',
  '#followbackalways',
  '#likeall',
  '#likealways',
  '#likebackteam',
  '#likeforlikeback',
  '#like4likes',
  '#likes4likes',
  
  // Spam/Generic engagement
  '#instamood',
  '#instagood', // Too generic, often flagged
  '#photooftheday', // Overused
  '#picoftheday',
  '#instalike',
  '#instadaily',
  '#follow',
  '#followme',
  '#like',
  '#likes',
  '#comment',
  '#comments',
  '#commenting',
  '#shoutout',
  '#shoutouts',
  '#s4s', // Shoutout for shoutout
  '#spam4spam',
  
  // Adult/Inappropriate content
  '#adult',
  '#adults',
  '#sexy',
  '#sexytime',
  '#ass',
  '#nude',
  '#nudity',
  '#naked',
  '#hot',
  '#porn',
  '#xxx',
  '#sex',
  '#hookup',
  '#dating',
  '#single',
  '#singles',
  '#tinder',
  '#snapchat',
  
  // Drugs/Controversial
  '#weed',
  '#marijuana',
  '#cannabis',
  '#420',
  '#ganja',
  '#kush',
  '#highlife',
  '#stoner',
  '#stoned',
  
  // Controversial/Violence
  '#death',
  '#funeral',
  '#killingit', // Can be flagged
  '#shooting',
  '#bomb',
  '#gun',
  '#guns',
  '#weapon',
  
  // Common Vietnamese spam hashtags
  '#xemngay',
  '#muangay',
  '#khuyenmai',
  '#giamgia',
  '#sale',
  '#freeship',
  '#codhanoi',
  '#codvietnam',
  '#inhoacaocap',
  
  // Deprecated/Broken hashtags
  '#brain',
  '#valentinesday',
  '#date',
  '#beyonce',
  '#stranger',
  '#alone',
  '#teenagers',
  '#teen',
  '#pushup',
  '#popular',
  '#models',
  '#attractive',
  
  // Other commonly flagged
  '#workflow',
  '#master',
  '#mustfollow',
  '#likebackalways',
  '#ilovemyfollowers',
  '#liketeam',
  '#igfollow',
  '#followtrain',
  '#iglike',
  '#teamfollow',
]);

/**
 * Check if hashtag is on shadowban list
 */
export function isShadowbanHashtag(hashtag: string): boolean {
  const normalized = hashtag.toLowerCase().replace('#', '');
  return SHADOWBAN_HASHTAGS.has(`#${normalized}`);
}

/**
 * Get shadowban status with severity
 */
export function getShadowbanStatus(hashtag: string): {
  isBanned: boolean;
  severity: 'high' | 'medium' | 'low';
  reason: string;
} {
  const normalized = hashtag.toLowerCase().replace('#', '');
  const banned = SHADOWBAN_HASHTAGS.has(`#${normalized}`);
  
  if (!banned) {
    return {
      isBanned: false,
      severity: 'low',
      reason: ''
    };
  }
  
  // Determine severity based on category
  const highRiskPatterns = ['follow4follow', 'like4like', 'f4f', 'l4l', 'porn', 'xxx', 'sex', 'nude'];
  const mediumRiskPatterns = ['follow', 'like', 'instagood', 'photooftheday'];
  
  const isHighRisk = highRiskPatterns.some(pattern => normalized.includes(pattern));
  const isMediumRisk = mediumRiskPatterns.some(pattern => normalized === pattern);
  
  return {
    isBanned: true,
    severity: isHighRisk ? 'high' : isMediumRisk ? 'medium' : 'low',
    reason: isHighRisk 
      ? 'Engagement pod / Spam hashtag - Có thể bị shadowban ngay lập tức'
      : isMediumRisk
      ? 'Hashtag quá phổ biến - Có thể giảm reach'
      : 'Hashtag không được khuyến khích'
  };
}
