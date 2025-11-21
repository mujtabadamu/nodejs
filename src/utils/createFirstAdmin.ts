import adminModel from "../models/adminModel";
import dotenv from "dotenv";
import pool from "../config/db";
import readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createFirstAdmin = async () => {
  try {
    // Check if credentials passed as command-line arguments
    const args = process.argv.slice(2);
    const useDefaults = args.includes("--default");
    
    let username: string;
    let email: string;
    let password: string;

    if (useDefaults) {
      // Use default credentials for quick testing
      username = "admin";
      email = "admin@admin.com";
      password = "admin123";
      
      console.log("\n🔐 Creating Default Admin User...\n");
    } else {
      console.log("\n🔐 Create First Admin User\n");
      console.log("This will create the first admin account for your location tracker.\n");
      console.log("💡 Tip: Run with --default flag to create admin@admin.com / admin123\n");

      // Check if any admin already exists
      const adminExists = await adminModel.adminExists();
      if (adminExists) {
        console.log("⚠️  Admin user(s) already exist!");
        const proceed = await question("Do you want to create another admin? (y/n): ");
        if (proceed.toLowerCase() !== "y") {
          console.log("❌ Cancelled.");
          rl.close();
          pool.end();
          process.exit(0);
        }
      }

      // Get admin details interactively
      username = await question("Username: ");
      if (!username || username.length < 3) {
        console.log("❌ Username must be at least 3 characters");
        rl.close();
        pool.end();
        process.exit(1);
      }

      email = await question("Email: ");
      if (!email || !email.includes("@")) {
        console.log("❌ Invalid email address");
        rl.close();
        pool.end();
        process.exit(1);
      }

      password = await question("Password (min 6 characters): ");
      if (!password || password.length < 6) {
        console.log("❌ Password must be at least 6 characters");
        rl.close();
        pool.end();
        process.exit(1);
      }
    }

    // Check if username or email already exists
    const existingUsername = await adminModel.findByUsername(username);
    if (existingUsername) {
      console.log("❌ Username already taken");
      if (useDefaults) {
        console.log("\n💡 Default admin already exists! Use these credentials:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:    admin@admin.com");
        console.log("🔑 Password: admin123");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      }
      rl.close();
      pool.end();
      process.exit(0);
    }

    const existingEmail = await adminModel.findByEmail(email);
    if (existingEmail) {
      console.log("❌ Email already registered");
      if (useDefaults) {
        console.log("\n💡 Default admin already exists! Use these credentials:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:    admin@admin.com");
        console.log("🔑 Password: admin123");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      }
      rl.close();
      pool.end();
      process.exit(0);
    }

    // Create admin
    const admin = await adminModel.createAdmin({
      username,
      email,
      password,
    });

    console.log("\n✅ Admin user created successfully!");
    
    if (useDefaults) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📧 Email:    admin@admin.com");
      console.log("🔑 Password: admin123");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n⚠️  IMPORTANT: Change this password in production!");
      console.log("🔗 Login at: http://localhost:5173/tracker\n");
    } else {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 Email:    ${admin.email}`);
      console.log(`👤 Username: ${admin.username}`);
      console.log(`📅 Created:  ${admin.createdAt}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log("\n📝 Save these credentials! You can now login.\n");
    }

    rl.close();
    pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin:", error.message);
    rl.close();
    pool.end();
    process.exit(1);
  }
};

createFirstAdmin();

