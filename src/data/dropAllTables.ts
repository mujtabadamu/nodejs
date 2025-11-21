import pool from "../config/db";

/**
 * Drop all tables - fresh start
 * WARNING: This will delete ALL data!
 */
const dropAllTables = async () => {
  try {
    console.log("🗑️  Dropping all tables...\n");

    // Drop tables in correct order (respecting foreign keys)
    await pool.query("DROP TABLE IF EXISTS locations CASCADE;");
    console.log("✅ Dropped locations table");

    await pool.query("DROP TABLE IF EXISTS admin_users CASCADE;");
    console.log("✅ Dropped admin_users table");

    await pool.query("DROP TABLE IF EXISTS users CASCADE;");
    console.log("✅ Dropped users table (if exists)");

    console.log("\n✨ All tables dropped successfully!");
    console.log("\n📝 Next step: Run 'npm run dev' to create fresh tables");

  } catch (error: any) {
    console.error("\n❌ Error dropping tables:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run if executed directly
if (require.main === module) {
  dropAllTables()
    .then(() => {
      console.log("\n✅ Drop script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Drop script failed:", error);
      process.exit(1);
    });
}

export default dropAllTables;

