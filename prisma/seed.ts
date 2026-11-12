// prisma/seed.ts

/**
 * SEED SCRIPT - INITIAL DATABASE POPULATION
 *
 * Script that populates the database with initial development data.
 *
 * What is a seed?
 * - A set of initial data inserted into the database when the application is set up
 * - Useful for development, testing and demonstrating the platform
 *
 * How to run:
 *   npm run seed
 *   or
 *   npx prisma db seed
 *
 * Data created by this script:
 * - Categories (5 categories of sustainable products)
 * - Certificates (5 environmental certifications)
 * - Users (6 users with different profiles: ADMIN, CUSTOMER, BRAND)
 * - Brands (3 partner brands)
 * - Products (10 products with certifications)
 *
 * IDEMPOTENCY (REQ-OPS-03): categories, certificates, users and brands use
 * upsert (always safe to repeat). Products are only created if the catalog is
 * empty — the seed NEVER deletes existing products. Previously, this script
 * deleted and recreated the products on every startup (`docker compose up`), which
 * destroyed any photo or edit made after the first seed.
 * To really reset, use `prisma migrate reset` (wipes the whole database).
 *
 * PASSWORD (REQ-OPS-02): the demo users now get a real bcrypt hash (no longer
 * the "hash-seguro-aqui" placeholder, which let nobody log in). The password is
 * the same for all demo users and **must** come from SEED_USER_PASSWORD
 * (12+ characters): there is no embedded password in the code (REQ-OPS-09). This
 * seed is for development only; in production the catalog starts empty and only
 * the ADMIN is created (seed-admin.ts).
 *
 * @see prisma/schema.prisma - Model definitions
 * @see prisma.config.ts - Seed configuration
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, UserType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { requireSeedPassword } from "./seed-password";

/**
 * Plain-text password of the demo users (they all share the same one,
 * for simplicity). Same hashing cost used in the rest of the app
 * (services/user.service.ts, prisma/seed-admin.ts).
 */
const SEED_USER_PASSWORD = requireSeedPassword(
  "SEED_USER_PASSWORD",
  process.env.SEED_USER_PASSWORD,
);
const SALT_ROUNDS = 12;

/**
 * Database connection string.
 * Must be defined in the .env.local file.
 */
const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Prisma Client instance using the PostgreSQL adapter.
 * Needed because the seed runs outside the Next.js application context.
 */
const prisma = new PrismaClient({ adapter });

/**
 * Main seed function.
 * Execution order matters because of the foreign key relations:
 * 1. Clears existing data (starting with the relation tables)
 * 2. Creates categories
 * 3. Creates certificates
 * 4. Creates users
 * 5. Creates brands (depends on users)
 * 6. Creates products (depends on categories and brands)
 * 7. Associates certificates with products
 */
async function main() {
  console.log("Starting database seeding...\n");

  // ---------------------------------------------------------------------------
  // STEP 2: CATEGORIAS
  // ---------------------------------------------------------------------------
  // Categories organize products by type.
  // Uses upsert so nothing is duplicated if they already exist (idempotency).
  console.log("Creating categories...");
  const categoriesInput = [
    {
      name: "Sustainable Clothing",
      description:
        "Clothing made from eco-friendly materials, organic cotton and recycled fabrics.",
    },
    {
      name: "Organic Food",
      description:
        "Food free of pesticides and preservatives, grown with respect for the soil.",
    },
    {
      name: "Natural Cosmetics",
      description:
        "Vegan makeup and creams, paraben-free and not tested on animals.",
    },
    {
      name: "Home and Decor",
      description:
        "Home items made of bamboo, handmade ceramics and biodegradable materials.",
    },
    {
      name: "Eco-Friendly Footwear",
      description:
        "Sneakers and shoes made of recycled rubber and vegan leather.",
    },
  ];

  const categories = {} as Record<string, number>;
  for (const cat of categoriesInput) {
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories[record.name] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 3: CERTIFICADOS
  // ---------------------------------------------------------------------------
  // Certificates attest to the products' sustainable practices.
  console.log("Creating certificates...");
  const certificatesInput = [
    {
      name: "Cruelty Free",
      issuingBody: "PETA",
      description:
        "Ensures the product was not tested on animals at any stage.",
    },
    {
      name: "Organic Brazil",
      issuingBody: "SisOrg",
      description: "Official national certification for organic products.",
    },
    {
      name: "FSC",
      issuingBody: "Forest Stewardship Council",
      description:
        "Ensures the wood/paper comes from well-managed forests.",
    },
    {
      name: "Eureciclo",
      issuingBody: "Instituto Eureciclo",
      description: "Environmental offsetting of packaging.",
    },
    {
      name: "IBD Natural Ingredients",
      issuingBody: "IBD Certifications",
      description: "Audit of natural ingredients in cosmetics.",
    },
  ];

  const certificates = {} as Record<string, number>;
  for (const cert of certificatesInput) {
    const record = await prisma.certificate.upsert({
      where: { name: cert.name },
      update: {},
      create: cert,
    });
    certificates[record.name] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: USERS
  // ---------------------------------------------------------------------------
  // Creates users with different profiles to test authentication and permissions.
  // All of them share SEED_USER_PASSWORD (see the top of the file) with a real bcrypt
  // hash — previously the password was the "hash-seguro-aqui" placeholder and nobody
  // could log in as any of these users (REQ-OPS-02).
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, SALT_ROUNDS);
  const usersInput = [
    {
      email: "admin@ecoplace.com",
      name: "Main Admin",
      password: passwordHash,
      type: UserType.ADMIN,
    },
    {
      email: "john@customer.com",
      name: "John Smith",
      password: passwordHash,
      phone: "11999998888",
      type: UserType.CUSTOMER,
    },
    {
      email: "maria@customer.com",
      name: "Maria Souza",
      password: passwordHash,
      phone: "21988887777",
      type: UserType.CUSTOMER,
    },
    {
      email: "contato@ecobrand.com",
      name: "Lucas (EcoBrand)",
      password: passwordHash,
      type: UserType.BRAND,
    },
    {
      email: "contact@purenaturals.com",
      name: "Ana (Pure Naturals)",
      password: passwordHash,
      type: UserType.BRAND,
    },
    {
      email: "sales@bamboohome.com",
      name: "Carlos (Bamboo Home)",
      password: passwordHash,
      type: UserType.BRAND,
    },
  ];

  const users = {} as Record<string, number>;
  for (const user of usersInput) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    users[record.email] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 5: BRANDS
  // ---------------------------------------------------------------------------
  // Each brand is associated with a user (1:1 relationship).
  console.log("Creating brands...");
  const brandsInput = [
    {
      name: "EcoBrand",
      description: "The best sustainable clothing brand in the national market.",
      userId: users["contato@ecobrand.com"],
    },
    {
      name: "Pure Naturals",
      description: "100% organic and healthy cosmetics and food.",
      userId: users["contact@purenaturals.com"],
    },
    {
      name: "Bamboo Home",
      description: "Decorate your home without destroying the planet.",
      userId: users["sales@bamboohome.com"],
    },
  ];

  const brands = {} as Record<string, number>;
  for (const brand of brandsInput) {
    const record = await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: { ...brand, status: "APPROVED" },
    });
    brands[record.name] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 6: PRODUCTS
  // ---------------------------------------------------------------------------
  // Catalog of sustainable products with associated certifications.
  console.log("Creating product catalog...");
  const productsInput = [
    // EcoBrand - Sustainable Clothing
    {
      name: "Organic Basic T-Shirt",
      description: "100% organic cotton, natural dyeing.",
      price: 89.9,
      category: "Sustainable Clothing",
      brand: "EcoBrand",
      certs: ["Organic Brazil", "Eureciclo"],
    },
    {
      name: "Recycled Jeans",
      description: "Made from scraps and plastic taken from the ocean.",
      price: 199.5,
      category: "Sustainable Clothing",
      brand: "EcoBrand",
      certs: ["Eureciclo"],
    },
    {
      name: "Vegan Leather Sneakers",
      description: "Stylish, durable and made from pineapple peel.",
      price: 350.0,
      category: "Eco-Friendly Footwear",
      brand: "EcoBrand",
      certs: ["Cruelty Free"],
    },

    // Pure Naturals - Cosmetics and Food
    {
      name: "Rosemary Solid Shampoo",
      description: "Lasts up to 60 washes. Zero plastic.",
      price: 35.9,
      category: "Natural Cosmetics",
      brand: "Pure Naturals",
      certs: ["Cruelty Free", "IBD Natural Ingredients"],
    },
    {
      name: "Vegan Face Cream",
      description: "Deep hydration with plant-based hyaluronic acid.",
      price: 120.0,
      category: "Natural Cosmetics",
      brand: "Pure Naturals",
      certs: ["Cruelty Free", "Eureciclo"],
    },
    {
      name: "Premium Organic Granola",
      description: "Mix of nuts and seeds with no added sugar.",
      price: 45.0,
      category: "Organic Food",
      brand: "Pure Naturals",
      certs: ["Organic Brazil"],
    },
    {
      name: "Special Roasted Coffee",
      description: "Selected beans from family farming.",
      price: 28.5,
      category: "Organic Food",
      brand: "Pure Naturals",
      certs: ["Organic Brazil", "FSC"],
    },

    // Bamboo Home - Home and Decor
    {
      name: "Bamboo Toothbrush Kit",
      description: "Pack of 4 100% biodegradable brushes.",
      price: 40.0,
      category: "Home and Decor",
      brand: "Bamboo Home",
      certs: ["FSC", "Eureciclo"],
    },
    {
      name: "Sustainable Fiber Cup",
      description: "Take your coffee anywhere without creating waste.",
      price: 55.9,
      category: "Home and Decor",
      brand: "Bamboo Home",
      certs: ["Eureciclo"],
    },
    {
      name: "Wooden Desk Organizer",
      description: "Minimalist design made with reforestation wood.",
      price: 110.0,
      category: "Home and Decor",
      brand: "Bamboo Home",
      certs: ["FSC"],
    },
  ];

  const existingProductsTotal = await prisma.product.count();
  if (existingProductsTotal > 0) {
    console.log(
      `Catalog already has ${existingProductsTotal} product(s); skipping creation ` +
        "(idempotent seed, REQ-OPS-03 — existing products are never deleted).",
    );
  } else {
    for (const prod of productsInput) {
      const fixedName = prod.name || (prod as any).row;

      await prisma.product.create({
        data: {
          name: fixedName as string,
          description: prod.description,
          price: prod.price,
          categoryId: categories[prod.category],
          brandId: brands[prod.brand],
          certificates: {
            create: prod.certs.map((certificateName) => ({
              certificateId: certificates[certificateName],
            })),
          },
        },
      });
    }
  }

  console.log(
    "(idempotent seed, REQ-OPS-03 — existing products are never deleted).",
  );
}

/**
 * Runs the seed and handles errors.
 * - On error, prints to the console and exits with code 1
 * - At the end, disconnects from the database
 */
main()
  .catch((e) => {
    console.error("Error running the seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
