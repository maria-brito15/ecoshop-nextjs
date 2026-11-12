// prisma/seed-admin.ts

/**
 * SEED ADMIN SCRIPT - ADMINISTRATOR CREATION
 *
 * Dedicated script to create an administrator user in the database.
 *
 * Why a separate script?
 * - The main seed (seed.ts) uses password placeholders ("hash-seguro-aqui")
 * - This script generates a REAL bcrypt hash from a supplied password
 * - It creates an admin with working credentials for login
 *
 * How to use:
 *   1. Set the environment variables (or edit the values directly)
 *   2. Run: npx tsx prisma/seed-admin.ts
 *
 * There is no embedded password (REQ-OPS-09): ADMIN_PASSWORD is required, with at
 * least 12 characters; without it the script exits before writing anything.
 *
 * Environment variables:
 *   ADMIN_PASSWORD - Administrator password (required, 12+ characters)
 *   ADMIN_EMAIL - Administrator email (default: admin@ecoshop.com)
 *   ADMIN_NAME - Administrator name (optional)
 *   ADMIN_PHONE - Administrator phone (optional)
 *
 * @see prisma/seed.ts - Full seed with demo data
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, UserType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { requireSeedPassword } from "./seed-password";

/**
 * Administrator settings.
 * Can be overridden by environment variables.
 */
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || "admin@ecoshop.com",
  password: requireSeedPassword("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD),
  name: process.env.ADMIN_NAME || "EcoShop Administrator",
  phone: process.env.ADMIN_PHONE || "(11) 99999-8888",
};

/**
 * Number of bcrypt hashing rounds.
 * Same value used in the service (SALT_ROUNDS = 12).
 */
const SALT_ROUNDS = 12;

/**
 * Database connection string.
 */
const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Generates a bcrypt hash from the password.
 *
 * @param password - Plain-text password
 * @returns Bcrypt hash of the password
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Creates or updates the administrator user.
 *
 * If the email already exists, updates the password and name to the current values.
 * This guarantees you always have a working admin, even if the main seed
 * was run with placeholders.
 */
async function createOrUpdateAdmin() {
  console.log("\n🔧 Configuring administrator...");
  console.log(`   Email: ${ADMIN_CONFIG.email}`);
  console.log(`   Name: ${ADMIN_CONFIG.name}`);
  console.log(`   Password: ${"•".repeat(ADMIN_CONFIG.password.length)} (hidden)`);

  // The password was already validated when ADMIN_CONFIG was built (REQ-OPS-09).

  // Hash the password
  const passwordHash = await hashPassword(ADMIN_CONFIG.password);

  // Check whether a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_CONFIG.email },
  });

  if (existingUser) {
    // Update the existing user
    console.log("\n📝 User already exists. Updating data...");

    const updatedUser = await prisma.user.update({
      where: { email: ADMIN_CONFIG.email },
      data: {
        name: ADMIN_CONFIG.name,
        password: passwordHash,
        phone: ADMIN_CONFIG.phone,
        type: UserType.ADMIN,
      },
    });

    console.log("\n✅ Administrator updated successfully!");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Type: ${updatedUser.type}`);
  } else {
    // Create a new administrator user
    console.log("\n📝 Creating new administrator...");

    const newAdmin = await prisma.user.create({
      data: {
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email,
        password: passwordHash,
        phone: ADMIN_CONFIG.phone,
        type: UserType.ADMIN,
      },
    });

    console.log("\n✅ Administrator created successfully!");
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Type: ${newAdmin.type}`);
  }
}

/**
 * Lists all existing administrators in the system.
 * Useful to check which admin accounts are available.
 */
async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { type: UserType.ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (admins.length > 0) {
    console.log("\n📋 Existing administrators in the system:");
    for (const admin of admins) {
      console.log(`   • ${admin.name} (${admin.email}) - ID: ${admin.id}`);
    }
  } else {
    console.log("\n⚠️ No administrator found in the system.");
  }

  return admins;
}

/**
 * Main function
 */
async function main() {
  console.log("\n🌿 ========================================");
  console.log("   ECOSHOP - ADMIN SEED");
  console.log("   ========================================\n");

  try {
    // Test the database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection established.\n");

    // List existing admins before the operation
    await listAdmins();

    // Create or update the main admin
    await createOrUpdateAdmin();

    // List the updated admins
    await listAdmins();

    // The password is NEVER printed: Docker and CI logs are retained (REQ-OPS-09).
    console.log("\n🔐 Administrator ready.");
    console.log(`   📧 Email: ${ADMIN_CONFIG.email}`);
    console.log("   🔑 Password: the one set in ADMIN_PASSWORD (not shown).");
    console.log("   Open the panel at /dashboard.\n");
  } catch (error) {
    console.error("\n❌ Error running the admin seed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
main();
