const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'autopost_vn',
  user: 'autopost_admin',
  password: 'autopost_vn_secure_2025'
});

async function resetPassword() {
  try {
    const email = 'c@gmail.com';
    const newPassword = '123456'; // New password
    
    console.log(`🔄 Resetting password for: ${email}\n`);
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const result = await pool.query(`
      UPDATE autopostvn_users
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
      RETURNING id, email
    `, [hashedPassword, email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
    } else {
      console.log('✅ Password reset successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   New password: ${newPassword}`);
      console.log('\n💡 You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();
