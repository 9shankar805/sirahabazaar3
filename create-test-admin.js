const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lUrnh3i1SmbR@ep-yellow-sun-a1n7em0q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function createTestAdmin() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    const result = await pool.query(`
      INSERT INTO admin_users (email, password, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active
      RETURNING id, email, full_name
    `, ['testadmin@test.com', hashedPassword, 'Test Admin User', 'admin', true]);
    
    console.log('✅ Test admin user created/updated:', result.rows[0]);
    console.log('Credentials: testadmin@test.com / admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createTestAdmin();