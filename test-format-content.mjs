import { formatSocialContent, hasMarkdown, stripMarkdown } from '../src/lib/utils/format-social-content.js';

console.log('🧪 Testing Social Content Formatter\n');

// Test case 1: Facebook post with markdown
const markdownContent = `
## Khuyến Mãi Đặc Biệt 🎉

**Giảm giá lên đến 50%** cho tất cả sản phẩm!

Chỉ còn **3 ngày** nữa thôi! Nhanh tay đặt hàng ngay nhé!

**Ưu đãi bao gồm:**
- Freeship toàn quốc
- Tặng kèm quà tặng giá trị
- *Bảo hành 12 tháng*

> Đừng bỏ lỡ cơ hội vàng này!

[Đặt hàng ngay](https://example.com)

#KhuyenMai #GiamGia #MuaSam
`;

console.log('📝 Original content (with markdown):');
console.log('---');
console.log(markdownContent);
console.log('---\n');

console.log('✅ Has markdown:', hasMarkdown(markdownContent));
console.log('');

// Format for Facebook
const facebookFormatted = formatSocialContent(markdownContent, 'facebook');
console.log('📘 Formatted for Facebook:');
console.log('---');
console.log(facebookFormatted);
console.log('---\n');

// Format for Instagram
const instagramFormatted = formatSocialContent(markdownContent, 'instagram');
console.log('📷 Formatted for Instagram:');
console.log('---');
console.log(instagramFormatted);
console.log('---\n');

// Format for TikTok
const tiktokFormatted = formatSocialContent(markdownContent, 'tiktok');
console.log('🎵 Formatted for TikTok:');
console.log('---');
console.log(tiktokFormatted);
console.log('---\n');

// Test case 2: Clean content without markdown
const cleanContent = `
🎉 KHUYẾN MÃI ĐẶC BIỆT

Giảm giá lên đến 50% cho tất cả sản phẩm!

Chỉ còn 3 ngày nữa thôi! Nhanh tay đặt hàng ngay nhé!

ƯU ĐÃI BAO GỒM:
✓ Freeship toàn quốc  
✓ Tặng kèm quà tặng giá trị
✓ Bảo hành 12 tháng

💬 Đừng bỏ lỡ cơ hội vàng này!

Đặt hàng ngay: https://example.com

#KhuyenMai #GiamGia #MuaSam
`;

console.log('📝 Clean content (no markdown):');
console.log('---');
console.log(cleanContent);
console.log('---\n');

console.log('✅ Has markdown:', hasMarkdown(cleanContent));
console.log('');

const cleanFormatted = formatSocialContent(cleanContent, 'facebook');
console.log('📘 After formatting (should be almost the same):');
console.log('---');
console.log(cleanFormatted);
console.log('---\n');

// Test plain text stripping
const stripped = stripMarkdown(markdownContent);
console.log('🔤 Plain text (all markdown removed):');
console.log('---');
console.log(stripped);
console.log('---\n');

console.log('✅ All tests completed!');
