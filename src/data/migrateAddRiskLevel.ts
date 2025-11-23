import pool from "../config/db";

/**
 * Migration: Add risk_level and risk_score to user_profiles table
 */
const migrateAddRiskLevel = async () => {
  try {
    console.log("🔄 Starting migration: Add risk_level and risk_score to user_profiles...");
    
    // Check if risk_level column exists
    const riskLevelCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='user_profiles' AND column_name='risk_level';
    `);
    
    if (riskLevelCheck.rows.length === 0) {
      console.log("➕ Adding risk_level column...");
      await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN risk_level VARCHAR(20) DEFAULT 'safe' 
        CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical'));
      `);
      console.log("✅ risk_level column added");
    } else {
      console.log("✅ risk_level column already exists");
    }
    
    // Check if risk_score column exists
    const riskScoreCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='user_profiles' AND column_name='risk_score';
    `);
    
    if (riskScoreCheck.rows.length === 0) {
      console.log("➕ Adding risk_score column...");
      await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN risk_score INTEGER DEFAULT 0 
        CHECK (risk_score >= 0 AND risk_score <= 100);
      `);
      console.log("✅ risk_score column added");
    } else {
      console.log("✅ risk_score column already exists");
    }
    
    // Check if risk_flags column exists
    const riskFlagsCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='user_profiles' AND column_name='risk_flags';
    `);
    
    if (riskFlagsCheck.rows.length === 0) {
      console.log("➕ Adding risk_flags column...");
      await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN risk_flags TEXT[] DEFAULT ARRAY[]::TEXT[];
      `);
      console.log("✅ risk_flags column added");
    } else {
      console.log("✅ risk_flags column already exists");
    }
    
    // Check if last_risk_analysis column exists
    const lastRiskAnalysisCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='user_profiles' AND column_name='last_risk_analysis';
    `);
    
    if (lastRiskAnalysisCheck.rows.length === 0) {
      console.log("➕ Adding last_risk_analysis column...");
      await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN last_risk_analysis TIMESTAMP;
      `);
      console.log("✅ last_risk_analysis column added");
    } else {
      console.log("✅ last_risk_analysis column already exists");
    }
    
    // Update existing rows to have default values
    await pool.query(`
      UPDATE user_profiles 
      SET risk_level = 'safe', risk_score = 0, risk_flags = ARRAY[]::TEXT[]
      WHERE risk_level IS NULL OR risk_score IS NULL;
    `);
    
    console.log("✨ Migration completed successfully!");
  } catch (error: any) {
    console.error("❌ Error during migration:", error.message);
    throw error;
  }
};

export default migrateAddRiskLevel;

