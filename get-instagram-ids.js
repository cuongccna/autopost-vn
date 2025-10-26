/**
 * 📸 Fetch Instagram Business Account IDs (Simple Version)
 * Uses unencrypted tokens from metadata
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchInstagramAccount(pageId, pageAccessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error };
    }

    const data = await response.json();
    return { success: true, data: data.instagram_business_account };
  } catch (error) {
    return { error: { message: error.message } };
  }
}

async function main() {
  console.log('📸 Fetching Instagram Business Account IDs...\n');

  try {
    // Get all Facebook Pages
    const { data: pages, error } = await supabase
      .from('autopostvn_social_accounts')
      .select('*')
      .eq('provider', 'facebook_page')
      .order('name');

    if (error) throw error;

    if (!pages || pages.length === 0) {
      console.log('⚠️  No Facebook Pages found');
      return;
    }

    console.log(`✅ Found ${pages.length} Facebook Page(s)\n`);
    console.log('═══════════════════════════════════════════════════════\n');

    const instagramAccounts = [];

    for (const page of pages) {
      console.log(`📄 ${page.name}`);
      console.log(`   Page ID: ${page.provider_id}`);

      // Get token from metadata
      const pageToken = page.metadata?.page?.access_token;
      
      if (!pageToken) {
        console.log('   ❌ No access token found in metadata\n');
        continue;
      }

      console.log('   🔑 Access token found');

      // Fetch Instagram account
      const result = await fetchInstagramAccount(page.provider_id, pageToken);

      if (result.error) {
        if (result.error.code === 190) {
          console.log('   ❌ Token expired or invalid');
        } else if (result.error.message?.includes('instagram_business_account')) {
          console.log('   ℹ️  No Instagram account linked');
        } else {
          console.log(`   ❌ Error: ${result.error.message}`);
        }
      } else if (result.data) {
        const ig = result.data;
        instagramAccounts.push({
          pageName: page.name,
          pageId: page.provider_id,
          igBusinessId: ig.id,
          igUsername: ig.username || ig.name,
          igProfilePic: ig.profile_picture_url
        });

        console.log('   ✅ Instagram Business Account FOUND! 🎉');
        console.log(`      📸 Username: @${ig.username || ig.name}`);
        console.log(`      🆔 Business ID: ${ig.id}`);
        if (ig.profile_picture_url) {
          console.log(`      🖼️  Profile: ${ig.profile_picture_url.substring(0, 50)}...`);
        }
      } else {
        console.log('   ℹ️  No Instagram account linked to this Page');
      }

      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📊 SUMMARY:');
    console.log(`   Facebook Pages checked: ${pages.length}`);
    console.log(`   Instagram Accounts found: ${instagramAccounts.length}\n`);

    if (instagramAccounts.length > 0) {
      console.log('✅ INSTAGRAM BUSINESS ACCOUNTS:\n');
      
      instagramAccounts.forEach((ig, index) => {
        console.log(`${index + 1}. ${ig.pageName}`);
        console.log(`   Instagram: @${ig.igUsername}`);
        console.log(`   Business ID: ${ig.igBusinessId}`);
        console.log(`   Linked to Page: ${ig.pageId}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════════');
      console.log('\n💡 NEXT STEPS:\n');
      console.log('1. Copy Instagram Business ID above');
      console.log('2. Save to database using OAuth callback update');
      console.log('3. Or save manually:\n');
      
      console.log('   INSERT INTO autopostvn_social_accounts (');
      console.log('     workspace_id, provider, provider_id, name, username,');
      console.log('     token_encrypted, metadata, status');
      console.log('   ) VALUES (');
      console.log(`     '<workspace_id>',`);
      console.log(`     'instagram',`);
      console.log(`     '<instagram_business_id>',`);
      console.log(`     '<instagram_username>',`);
      console.log(`     '<instagram_username>',`);
      console.log(`     '<encrypted_page_token>',`);
      console.log(`     '{"pageId": "<page_id>", "igBusinessId": "<ig_id>"}',`);
      console.log(`     'connected'`);
      console.log('   );\n');

      console.log('4. Test posting to Instagram from /compose page\n');

    } else {
      console.log('⚠️  No Instagram accounts found\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n💡 TO LINK INSTAGRAM:\n');
      console.log('1. Go to Facebook Page → Settings → Instagram');
      console.log('2. Click "Connect Account"');
      console.log('3. Login to your Instagram Business account');
      console.log('4. Authorize the connection');
      console.log('5. Re-run this script to verify\n');
      console.log('📖 See: INSTAGRAM-BUSINESS-SETUP-COMPLETE.md\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
