import pool from "../config/db";

/**
 * Migration: Add user_id column to chat_conversations table
 * This allows conversations to be linked to authenticated users
 */
const addUserIdToConversations = async () => {
  try {
    console.log("🔄 Adding user_id to chat_conversations table...\n");

    // Add user_id column (nullable for backward compatibility with device-only chats)
    await pool.query(`
      ALTER TABLE chat_conversations 
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'New Conversation';
    `);
    
    console.log("✅ Added user_id and title columns");

    // Add foreign key constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_conversations_user'
        ) THEN
          ALTER TABLE chat_conversations
          ADD CONSTRAINT fk_conversations_user
          FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    
    console.log("✅ Added foreign key constraint");

    // Create index for user_id lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_user
      ON chat_conversations(user_id)
      WHERE user_id IS NOT NULL;
    `);
    
    console.log("✅ Created index on user_id");

    console.log("\n✨ Migration completed successfully!");

  } catch (error: any) {
    console.error("❌ Error in migration:", error.message);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  addUserIdToConversations()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default addUserIdToConversations;

