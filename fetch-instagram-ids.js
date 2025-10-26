/**
 * 📸 Fetch Instagram Business Account IDs from Facebook Pages
 * 
 * This script:
 * 1. Gets all Facebook Pages from database
 * 2. Uses Page Access Token to query Instagram Business Account
 * 3. Displays Instagram IDs for connected accounts
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Decrypt token function
function decrypt(encryptedData) {
  try {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not found in environment');
    }

    // Check if it's new format (iv:authTag:encryptedData) or legacy
    const parts = encryptedData.split(':');
    
    if (parts.length === 3) {
      // New AES-256-GCM format
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const key = Buffer.from(ENCRYPTION_KEY, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } else {
      // Legacy AES-256-CBC format
      const [ivHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const key = Buffer.from(ENCRYPTION_KEY, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    }
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    return null;
  }
}

// Fetch Instagram Business Account from Facebook Page
async function fetchInstagramAccount(pageId, pageAccessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      if (error.error?.code === 190) {
        console.error(`   ❌ Token expired or invalid`);
      } else if (error.error?.message?.includes('instagram_business_account')) {
        console.log(`   ℹ️  No Instagram account linked to this Page`);
      } else {
        console.error(`   ❌ Graph API error:`, error.error?.message || 'Unknown error');
      }
      return null;
    }

    const data = await response.json();
    return data.instagram_business_account || null;
  } catch (error) {
    console.error(`   ❌ Request failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('📸 Fetching Instagram Business Account IDs...\n');

  try {
    // Get all Facebook Pages from database
    const { data: pages, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('provider', 'facebook_page')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!pages || pages.length === 0) {
      console.log('⚠️  No Facebook Pages found in database');
      return;
    }

    console.log(`✅ Found ${pages.length} Facebook Page(s)\n`);

    let instagramCount = 0;
    const instagramAccounts = [];

    // Check each page for Instagram account
    for (const page of pages) {
      console.log(`📄 Page: ${page.name} (ID: ${page.provider_id})`);

      // Decrypt page access token
      const pageToken = decrypt(page.token_encrypted);
      if (!pageToken) {
        console.log('   ❌ Failed to decrypt token\n');
        continue;
      }

      console.log('   🔑 Token decrypted successfully');

      // Fetch Instagram account
      const igAccount = await fetchInstagramAccount(page.provider_id, pageToken);

      if (igAccount) {
        instagramCount++;
        instagramAccounts.push({
          pageName: page.name,
          pageId: page.provider_id,
          igBusinessId: igAccount.id,
          igUsername: igAccount.username || igAccount.name,
          igProfilePic: igAccount.profile_picture_url
        });

        console.log(`   ✅ Instagram Business Account found!`);
        console.log(`      📸 Username: @${igAccount.username || igAccount.name}`);
        console.log(`      🆔 Business ID: ${igAccount.id}`);
      }

      console.log(''); // Empty line
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Facebook Pages: ${pages.length}`);
    console.log(`   Instagram Accounts: ${instagramCount}`);

    if (instagramCount > 0) {
      console.log(`\n✅ INSTAGRAM ACCOUNTS FOUND:\n`);
      
      instagramAccounts.forEach((ig, index) => {
        console.log(`${index + 1}. Page: ${ig.pageName}`);
        console.log(`   Instagram: @${ig.igUsername}`);
        console.log(`   Business ID: ${ig.igBusinessId}`);
        console.log('');
      });

      console.log('\n💡 NEXT STEPS:');
      console.log('1. Copy the Instagram Business ID(s) above');
      console.log('2. Run OAuth again to auto-save Instagram accounts');
      console.log('3. Or manually save to database:\n');
      
      instagramAccounts.forEach((ig) => {
        console.log(`   INSERT INTO autopostvn_social_accounts (provider, provider_id, name, ...)`);
        console.log(`   VALUES ('instagram', '${ig.igBusinessId}', '@${ig.igUsername}', ...);`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No Instagram accounts found');
      console.log('\n💡 TO CONNECT INSTAGRAM:');
      console.log('1. Go to Facebook Page → Settings → Instagram');
      console.log('2. Click "Connect Account"');
      console.log('3. Login and authorize');
      console.log('4. Re-run this script\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
