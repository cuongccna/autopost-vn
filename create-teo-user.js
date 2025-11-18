// Script tạo user teo@gmail.com cho local development
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/autopostvn',
});

async function createTeoUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating user: teo@gmail.com');
    
    // Hash password
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const checkQuery = 'SELECT id FROM autopostvn_users WHERE email = $1';
    const existing = await client.query(checkQuery, ['teo@gmail.com']);
    
    if (existing.rows.length > 0) {
      console.log('⚠️ User already exists, updating password...');
      
      // Update password
      const updateQuery = `
        UPDATE autopostvn_users 
        SET password_hash = $1, updated_at = NOW()
        WHERE email = $2
        RETURNING id, email, full_name, user_role
      `;
      
      const result = await client.query(updateQuery, [hashedPassword, 'teo@gmail.com']);
      console.log('✅ User password updated:', result.rows[0]);
    } else {
      console.log('📝 Creating new user...');
      
      // Insert new user
      const insertQuery = `
        INSERT INTO autopostvn_users (
          email, 
          password_hash, 
          full_name, 
          user_role,
          email_verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, full_name, user_role
      `;
      
      const result = await client.query(insertQuery, [
        'teo@gmail.com',
        hashedPassword,
        'Teo Nguyen',
        'admin',
        true
      ]);
      
      console.log('✅ User created:', result.rows[0]);
    }
    
    console.log('\n📋 Login credentials:');
    console.log('Email: teo@gmail.com');
    console.log('Password: 123456');
    console.log('\n🌐 Login URL: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTeoUser();
