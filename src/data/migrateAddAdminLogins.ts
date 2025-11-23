import pool from "../config/db";

/**
 * Migration: Add admin_logins table to track admin login events
 */
const migrateAddAdminLogins = async () => {
  try {
    console.log("🔄 Starting migration: Add admin_logins table...");
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name='admin_logins';
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("➕ Creating admin_logins table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_logins (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          success BOOLEAN NOT NULL,
          failure_reason VARCHAR(100),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
        );
      `);
      
      // Create indexes for faster queries
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_logins_admin_id 
        ON admin_logins(admin_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_logins_timestamp 
        ON admin_logins(timestamp DESC);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_logins_ip 
        ON admin_logins(ip_address);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_logins_success 
        ON admin_logins(success);
      `);
      
      console.log("✅ admin_logins table created with indexes");
    } else {
      console.log("✅ admin_logins table already exists");
    }
    
    console.log("✨ Migration completed successfully!");
  } catch (error: any) {
    console.error("❌ Error during migration:", error.message);
    throw error;
  }
};

export default migrateAddAdminLogins;

