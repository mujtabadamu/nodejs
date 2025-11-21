import pool from "../config/db";

const createTables = async () => {
  try {
    // Create locations table with IP-based geolocation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) UNIQUE NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        city VARCHAR(100),
        region VARCHAR(100),
        country VARCHAR(100),
        country_code VARCHAR(2),
        isp TEXT,
        timezone VARCHAR(50),
        is_local BOOLEAN DEFAULT false,
        timestamp BIGINT NOT NULL,
        user_agent TEXT,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER DEFAULT 1,
        CONSTRAINT lat_range CHECK (lat >= -90 AND lat <= 90),
        CONSTRAINT lng_range CHECK (lng >= -180 AND lng <= 180)
      );
    `);
    console.log("✅ Locations table created or already exists");

    // Create admin_users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Admin users table created or already exists");

    // Create indexes for faster location queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_device_id 
      ON locations(device_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_timestamp 
      ON locations(timestamp DESC);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_last_seen 
      ON locations(last_seen DESC);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_ip 
      ON locations(ip_address);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_country 
      ON locations(country_code);
    `);
    
    console.log("✅ Database indexes created");

  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
};

export default createTables;

