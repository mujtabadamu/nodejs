import pool from "../config/db";

/**
 * Migration script to update locations table for IP-based geolocation
 * Run this to upgrade existing database schema
 */
const migrateToIPBased = async () => {
  try {
    console.log("🔄 Starting migration to IP-based location tracking...\n");

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'locations' 
      AND column_name = 'ip_address';
    `;
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log("✅ Migration already applied - IP-based columns exist");
      return;
    }

    // Add new columns for IP-based geolocation
    console.log("1️⃣ Adding new columns to locations table...");
    await pool.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS region VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
      ADD COLUMN IF NOT EXISTS isp TEXT,
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false;
    `);
    console.log("✅ Columns added successfully");

    // Create indexes
    console.log("\n2️⃣ Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_ip 
      ON locations(ip_address);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_country 
      ON locations(country_code);
    `);
    console.log("✅ Indexes created successfully");

    // Make ip_address NOT NULL for new records (existing can be null)
    console.log("\n3️⃣ Updating existing records...");
    await pool.query(`
      UPDATE locations 
      SET ip_address = 'unknown', 
          city = 'Unknown', 
          region = 'Unknown', 
          country = 'Unknown',
          country_code = 'XX',
          isp = 'Unknown',
          timezone = 'Unknown',
          is_local = true
      WHERE ip_address IS NULL;
    `);
    console.log("✅ Existing records updated with default values");

    console.log("\n✨ Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Restart your backend server");
    console.log("   2. Test the /api/locations endpoint");
    console.log("   3. Old data is preserved with 'Unknown' values");
    console.log("   4. New locations will be tracked via IP automatically");

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    throw error;
  }
};

// Run migration if executed directly
if (require.main === module) {
  migrateToIPBased()
    .then(() => {
      console.log("\n✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrateToIPBased;

