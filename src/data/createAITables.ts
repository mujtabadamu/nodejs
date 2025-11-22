import pool from "../config/db";

/**
 * Create tables for AI chat system and user profiles
 */
const createAITables = async () => {
  try {
    console.log("🤖 Creating AI chat tables...\n");

    // User profiles collected from conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(100),
        age INTEGER,
        gender VARCHAR(20),
        location VARCHAR(100),
        occupation VARCHAR(100),
        interests TEXT[],
        passions TEXT[],
        goals TEXT[],
        personality_traits TEXT[],
        email VARCHAR(255),
        phone VARCHAR(50),
        profile_completion INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES locations(device_id) ON DELETE CASCADE
      );
    `);
    console.log("✅ User profiles table created");

    // Chat conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        ai_avatar VARCHAR(20) NOT NULL,
        user_id INTEGER,
        title VARCHAR(200) DEFAULT 'New Conversation',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        FOREIGN KEY (device_id) REFERENCES locations(device_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
      );
    `);
    console.log("✅ Chat conversations table created");

    // Chat messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        device_id VARCHAR(64) NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        extracted_info JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (device_id) REFERENCES locations(device_id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Chat messages table created");

    // Indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_device 
      ON user_profiles(device_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_device 
      ON chat_conversations(device_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_active 
      ON chat_conversations(is_active) WHERE is_active = true;
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON chat_messages(conversation_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
      ON chat_messages(timestamp DESC);
    `);
    
    console.log("✅ AI chat indexes created");

    console.log("\n✨ AI chat system tables created successfully!");

  } catch (error: any) {
    console.error("❌ Error creating AI tables:", error.message);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  createAITables()
    .then(() => {
      console.log("\n✅ AI tables setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ AI tables setup failed:", error);
      process.exit(1);
    });
}

export default createAITables;

