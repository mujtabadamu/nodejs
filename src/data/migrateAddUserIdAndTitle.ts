import pool from "../config/db";

/**
 * Migration: Add user_id and title columns to chat_conversations table
 */
const migrateAddUserIdAndTitle = async () => {
  try {
    console.log("🔄 Starting migration: Add user_id and title to chat_conversations...\n");

    // Check if user_id column exists
    const checkUserIdQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_conversations' 
      AND column_name = 'user_id';
    `;
    const userIdExists = await pool.query(checkUserIdQuery);

    if (userIdExists.rows.length === 0) {
      console.log("➕ Adding user_id column...");
      await pool.query(`
        ALTER TABLE chat_conversations 
        ADD COLUMN user_id INTEGER;
      `);
      
      // Add foreign key constraint
      await pool.query(`
        ALTER TABLE chat_conversations 
        ADD CONSTRAINT fk_user_id 
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL;
      `);
      console.log("✅ user_id column added with foreign key constraint");
    } else {
      console.log("⏭️  user_id column already exists, skipping");
    }

    // Check if title column exists
    const checkTitleQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_conversations' 
      AND column_name = 'title';
    `;
    const titleExists = await pool.query(checkTitleQuery);

    if (titleExists.rows.length === 0) {
      console.log("➕ Adding title column...");
      await pool.query(`
        ALTER TABLE chat_conversations 
        ADD COLUMN title VARCHAR(200) DEFAULT 'New Conversation';
      `);
      
      // Update existing rows to have a title
      await pool.query(`
        UPDATE chat_conversations 
        SET title = 'Conversation #' || id 
        WHERE title IS NULL;
      `);
      console.log("✅ title column added and existing rows updated");
    } else {
      console.log("⏭️  title column already exists, skipping");
    }

    console.log("\n✨ Migration completed successfully!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  migrateAddUserIdAndTitle()
    .then(() => {
      console.log("\n✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrateAddUserIdAndTitle;

