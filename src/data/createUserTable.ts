import pool from "../config/db";


const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    try {
      await pool.query(query);
      console.log("User table created successfully");
    } catch (error) {
      console.error("Error creating user table:", error);
    }
};

export default createUserTable;
