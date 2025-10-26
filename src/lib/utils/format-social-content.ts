/**
 * Format social media content by converting markdown to platform-appropriate format
 */

/**
 * Convert markdown to Facebook-friendly format
 * Facebook doesn't support markdown, so we need to convert to Unicode formatting
 */
export function formatForFacebook(content: string): string {
  let formatted = content;

  // Remove markdown bold (**text** or __text__) and replace with Unicode bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, (_, text) => convertToBold(text));
  formatted = formatted.replace(/__([^_]+)__/g, (_, text) => convertToBold(text));

  // Remove markdown italic (*text* or _text_)
  formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
  formatted = formatted.replace(/_([^_]+)_/g, '$1');

  // Convert markdown headers to uppercase with spacing
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (_, text) => {
    return `\n${text.toUpperCase()}\n${'-'.repeat(text.length)}\n`;
  });

  // Convert markdown lists to proper lists with emojis
  formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, '  ✓ $1');
  formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gm, (_, text: string, offset: number, string: string) => {
    const linesBefore = string.substring(0, offset).split('\n');
    const currentNumber = linesBefore.filter((line: string) => /^\s*\d+\./.test(line)).length + 1;
    return `  ${currentNumber}. $1`;
  });

  // Convert markdown links [text](url) to "text: url"
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');

  // Remove code blocks
  formatted = formatted.replace(/```[\s\S]*?```/g, '');
  formatted = formatted.replace(/`([^`]+)`/g, '$1');

  // Remove blockquotes
  formatted = formatted.replace(/^>\s+(.+)$/gm, '💬 $1');

  // Clean up excessive line breaks (more than 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  formatted = formatted.trim();

  return formatted;
}

/**
 * Convert text to Unicode bold characters
 * Facebook supports Unicode bold characters in posts
 */
function convertToBold(text: string): string {
  const boldMap: Record<string, string> = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵',
    'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽',
    'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅',
    'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛',
    'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣',
    'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫',
    'Y': '𝗬', 'Z': '𝗭',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳',
    '8': '𝟴', '9': '𝟵'
  };

  return text.split('').map(char => boldMap[char] || char).join('');
}

/**
 * Format Instagram content
 * Instagram supports line breaks and emojis well
 */
export function formatForInstagram(content: string): string {
  let formatted = content;

  // Keep emojis and line breaks
  // Remove markdown formatting
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');
  formatted = formatted.replace(/__([^_]+)__/g, '$1');
  formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
  formatted = formatted.replace(/_([^_]+)_/g, '$1');

  // Convert headers to caps
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (_, text) => text.toUpperCase());

  // Keep lists simple
  formatted = formatted.replace(/^\s*[-*+]\s+/gm, '• ');
  formatted = formatted.replace(/^\s*\d+\.\s+/gm, '');

  // Convert links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // Clean up
  formatted = formatted.replace(/```[\s\S]*?```/g, '');
  formatted = formatted.replace(/`([^`]+)`/g, '$1');
  formatted = formatted.replace(/^>\s+(.+)$/gm, '$1');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.trim();

  return formatted;
}

/**
 * Format TikTok content
 * TikTok has 300 char limit, keep it short
 */
export function formatForTikTok(content: string): string {
  let formatted = content;

  // Remove all markdown
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');
  formatted = formatted.replace(/[_*#`>]/g, '');
  formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Keep only first paragraph
  const firstParagraph = formatted.split('\n\n')[0];
  formatted = firstParagraph;

  // Trim to 300 chars
  if (formatted.length > 300) {
    formatted = formatted.substring(0, 297) + '...';
  }

  return formatted.trim();
}

/**
 * Format Zalo content
 * Zalo supports basic formatting
 */
export function formatForZalo(content: string): string {
  // Similar to Facebook but more conservative
  return formatForFacebook(content);
}

/**
 * Auto-detect and format content based on platform
 */
export function formatSocialContent(
  content: string,
  platform: 'facebook' | 'instagram' | 'tiktok' | 'zalo'
): string {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return formatForFacebook(content);
    case 'instagram':
      return formatForInstagram(content);
    case 'tiktok':
      return formatForTikTok(content);
    case 'zalo':
      return formatForZalo(content);
    default:
      return formatForFacebook(content);
  }
}

/**
 * Check if content contains markdown
 */
export function hasMarkdown(content: string): boolean {
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,      // Bold
    /__[^_]+__/,          // Bold
    /\*[^*]+\*/,          // Italic
    /_[^_]+_/,            // Italic
    /^#{1,6}\s+/m,        // Headers
    /^\s*[-*+]\s+/m,      // Unordered lists
    /^\s*\d+\.\s+/m,      // Ordered lists
    /\[.+\]\(.+\)/,       // Links
    /```[\s\S]*?```/,     // Code blocks
    /`[^`]+`/,            // Inline code
    /^>\s+/m,             // Blockquotes
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Remove all markdown formatting (plain text only)
 */
export function stripMarkdown(content: string): string {
  let text = content;

  // Remove bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');

  // Remove italic
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Remove headers
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Remove list markers
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Remove links (keep text)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}
