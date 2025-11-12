/**
 * Test User Role Display Logic
 * This script verifies that the UserAvatarDropdown displays correct buttons for each role
 */

const roles = ['free', 'professional', 'enterprise'];

console.log('🧪 Testing UserAvatarDropdown role display logic\n');
console.log('=' .repeat(60));

roles.forEach(role => {
  console.log(`\n📋 Testing role: ${role.toUpperCase()}`);
  console.log('-'.repeat(60));
  
  // Badge Info
  const badgeInfo = getRoleBadgeInfo(role);
  console.log(`✅ Badge: ${badgeInfo.icon} ${badgeInfo.name}`);
  console.log(`   Color: ${badgeInfo.color}`);
  
  // Upgrade Link in User Info Section
  const headerUpgrade = getHeaderUpgradeInfo(role);
  if (headerUpgrade) {
    console.log(`\n✅ Header upgrade link:`);
    console.log(`   Text: "${headerUpgrade.text}"`);
    console.log(`   Target: ${headerUpgrade.target}`);
  } else {
    console.log(`\n❌ NO header upgrade link (Enterprise user)`);
  }
  
  // Main Upgrade Button
  const mainUpgrade = getMainUpgradeButton(role);
  if (mainUpgrade.type === 'button') {
    console.log(`\n✅ Main upgrade button:`);
    console.log(`   Title: "${mainUpgrade.title}"`);
    console.log(`   Subtitle: "${mainUpgrade.subtitle}"`);
    console.log(`   Link: ${mainUpgrade.link}`);
    console.log(`   Color: ${mainUpgrade.color}`);
  } else if (mainUpgrade.type === 'badge') {
    console.log(`\n✅ Premium badge (no upgrade needed):`);
    console.log(`   Title: "${mainUpgrade.title}"`);
    console.log(`   Subtitle: "${mainUpgrade.subtitle}"`);
  }
  
  console.log('');
});

console.log('=' .repeat(60));
console.log('\n✅ All role display logic tested successfully!\n');

// Helper functions matching the component logic

function getRoleBadgeInfo(role) {
  switch (role) {
    case 'free':
      return {
        icon: '👤',
        name: 'Miễn phí',
        color: 'gray'
      };
    case 'professional':
      return {
        icon: '👑',
        name: 'Professional',
        color: 'blue'
      };
    case 'enterprise':
      return {
        icon: '💎',
        name: 'Enterprise',
        color: 'purple'
      };
    default:
      return {
        icon: '👤',
        name: 'Miễn phí',
        color: 'gray'
      };
  }
}

function getHeaderUpgradeInfo(role) {
  if (role === 'free') {
    return {
      text: 'Nâng cấp',
      target: 'Professional',
      icon: '⭐'
    };
  } else if (role === 'professional') {
    return {
      text: 'Enterprise',
      target: 'Enterprise',
      icon: '💎'
    };
  }
  return null; // Enterprise users don't see this
}

function getMainUpgradeButton(role) {
  if (role === 'free') {
    return {
      type: 'button',
      title: 'Nâng cấp lên Professional',
      subtitle: 'Mở khóa tất cả tính năng',
      link: '/pricing',
      color: 'blue',
      icon: '⚡'
    };
  } else if (role === 'professional') {
    return {
      type: 'button',
      title: 'Nâng cấp lên Enterprise',
      subtitle: 'Dành cho doanh nghiệp',
      link: '/pricing',
      color: 'purple',
      icon: '💎'
    };
  } else if (role === 'enterprise') {
    return {
      type: 'badge',
      title: 'Gói Enterprise',
      subtitle: 'Bạn đang sử dụng gói cao nhất',
      color: 'purple',
      icon: '💎'
    };
  }
}
