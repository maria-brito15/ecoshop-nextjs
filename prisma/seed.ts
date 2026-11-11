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
 * - Users (6 users with different profiles: ADMIN, CLIENTE, MARCA)
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

import { PrismaClient, TipoUsuario } from "@prisma/client";
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
      nome: "Sustainable Clothing",
      descricao:
        "Clothing made from eco-friendly materials, organic cotton and recycled fabrics.",
    },
    {
      nome: "Organic Food",
      descricao:
        "Food free of pesticides and preservatives, grown with respect for the soil.",
    },
    {
      nome: "Natural Cosmetics",
      descricao:
        "Vegan makeup and creams, paraben-free and not tested on animals.",
    },
    {
      nome: "Home and Decor",
      descricao:
        "Home items made of bamboo, handmade ceramics and biodegradable materials.",
    },
    {
      nome: "Eco-Friendly Footwear",
      descricao:
        "Sneakers and shoes made of recycled rubber and vegan leather.",
    },
  ];

  const categories = {} as Record<string, number>;
  for (const cat of categoriesInput) {
    const record = await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat,
    });
    categories[record.nome] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 3: CERTIFICADOS
  // ---------------------------------------------------------------------------
  // Certificates attest to the products' sustainable practices.
  console.log("Creating certificates...");
  const certificatesInput = [
    {
      nome: "Cruelty Free",
      orgaoEmissor: "PETA",
      descricao:
        "Ensures the product was not tested on animals at any stage.",
    },
    {
      nome: "Organic Brazil",
      orgaoEmissor: "SisOrg",
      descricao: "Official national certification for organic products.",
    },
    {
      nome: "FSC",
      orgaoEmissor: "Forest Stewardship Council",
      descricao:
        "Ensures the wood/paper comes from well-managed forests.",
    },
    {
      nome: "Eureciclo",
      orgaoEmissor: "Instituto Eureciclo",
      descricao: "Environmental offsetting of packaging.",
    },
    {
      nome: "IBD Natural Ingredients",
      orgaoEmissor: "IBD Certifications",
      descricao: "Audit of natural ingredients in cosmetics.",
    },
  ];

  const certificates = {} as Record<string, number>;
  for (const cert of certificatesInput) {
    const record = await prisma.certificado.upsert({
      where: { nome: cert.nome },
      update: {},
      create: cert,
    });
    certificates[record.nome] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: USERS
  // ---------------------------------------------------------------------------
  // Creates users with different profiles to test authentication and permissions.
  // Todos compartilham SEED_USER_PASSWORD (ver topo do arquivo) com hash bcrypt
  // real hash — previously the password was the "hash-seguro-aqui" placeholder and nobody
  // could log in as any of these users (REQ-OPS-02).
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, SALT_ROUNDS);
  const usersInput = [
    {
      email: "admin@ecoplace.com",
      nome: "Admin Principal",
      senha: passwordHash,
      tipo: TipoUsuario.ADMIN,
    },
    {
      email: "joao@cliente.com",
      nome: "John Smith",
      senha: passwordHash,
      telefone: "11999998888",
      tipo: TipoUsuario.CLIENTE,
    },
    {
      email: "maria@cliente.com",
      nome: "Maria Souza",
      senha: passwordHash,
      telefone: "21988887777",
      tipo: TipoUsuario.CLIENTE,
    },
    {
      email: "contato@ecobrand.com",
      nome: "Lucas (EcoBrand)",
      senha: passwordHash,
      tipo: TipoUsuario.MARCA,
    },
    {
      email: "falecom@pureza.com",
      nome: "Ana (Pureza Naturais)",
      senha: passwordHash,
      tipo: TipoUsuario.MARCA,
    },
    {
      email: "vendas@bambuhome.com",
      nome: "Carlos (Bambu Home)",
      senha: passwordHash,
      tipo: TipoUsuario.MARCA,
    },
  ];

  const users = {} as Record<string, number>;
  for (const user of usersInput) {
    const record = await prisma.usuario.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    users[record.email] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 5: MARCAS
  // ---------------------------------------------------------------------------
  // Each brand is associated with a user (1:1 relationship).
  console.log("Creating brands...");
  const brandsInput = [
    {
      nome: "EcoBrand",
      descricao: "The best sustainable clothing brand in the national market.",
      usuarioId: users["contato@ecobrand.com"],
    },
    {
      nome: "Pureza Naturais",
      descricao: "100% organic and healthy cosmetics and food.",
      usuarioId: users["falecom@pureza.com"],
    },
    {
      nome: "Bambu Home",
      descricao: "Decorate your home without destroying the planet.",
      usuarioId: users["vendas@bambuhome.com"],
    },
  ];

  const brands = {} as Record<string, number>;
  for (const brand of brandsInput) {
    const record = await prisma.marca.upsert({
      where: { nome: brand.nome },
      update: {},
      create: { ...brand, status: "APROVADA" },
    });
    brands[record.nome] = record.id;
  }

  // ---------------------------------------------------------------------------
  // STEP 6: PRODUTOS
  // ---------------------------------------------------------------------------
  // Catalog of sustainable products with associated certifications.
  console.log("Creating product catalog...");
  const productsInput = [
    // EcoBrand - Sustainable Clothing
    {
      nome: "Organic Basic T-Shirt",
      descricao: "100% organic cotton, natural dyeing.",
      preco: 89.9,
      categoria: "Sustainable Clothing",
      marca: "EcoBrand",
      certs: ["Organic Brazil", "Eureciclo"],
    },
    {
      nome: "Recycled Jeans",
      descricao: "Made from scraps and plastic taken from the ocean.",
      preco: 199.5,
      categoria: "Sustainable Clothing",
      marca: "EcoBrand",
      certs: ["Eureciclo"],
    },
    {
      nome: "Vegan Leather Sneakers",
      descricao: "Stylish, durable and made from pineapple peel.",
      preco: 350.0,
      categoria: "Eco-Friendly Footwear",
      marca: "EcoBrand",
      certs: ["Cruelty Free"],
    },

    // Pureza Naturais - Cosmetics and Food
    {
      nome: "Rosemary Solid Shampoo",
      descricao: "Lasts up to 60 washes. Zero plastic.",
      preco: 35.9,
      categoria: "Natural Cosmetics",
      marca: "Pureza Naturais",
      certs: ["Cruelty Free", "IBD Natural Ingredients"],
    },
    {
      nome: "Vegan Face Cream",
      descricao: "Deep hydration with plant-based hyaluronic acid.",
      preco: 120.0,
      categoria: "Natural Cosmetics",
      marca: "Pureza Naturais",
      certs: ["Cruelty Free", "Eureciclo"],
    },
    {
      nome: "Premium Organic Granola",
      descricao: "Mix of nuts and seeds with no added sugar.",
      preco: 45.0,
      categoria: "Organic Food",
      marca: "Pureza Naturais",
      certs: ["Organic Brazil"],
    },
    {
      nome: "Special Roasted Coffee",
      descricao: "Selected beans from family farming.",
      preco: 28.5,
      categoria: "Organic Food",
      marca: "Pureza Naturais",
      certs: ["Organic Brazil", "FSC"],
    },

    // Bambu Home - Home and Decor
    {
      nome: "Bamboo Toothbrush Kit",
      descricao: "Pack of 4 100% biodegradable brushes.",
      preco: 40.0,
      categoria: "Home and Decor",
      marca: "Bambu Home",
      certs: ["FSC", "Eureciclo"],
    },
    {
      nome: "Sustainable Fiber Cup",
      descricao: "Take your coffee anywhere without creating waste.",
      preco: 55.9,
      categoria: "Home and Decor",
      marca: "Bambu Home",
      certs: ["Eureciclo"],
    },
    {
      nome: "Wooden Desk Organizer",
      descricao: "Minimalist design made with reforestation wood.",
      preco: 110.0,
      categoria: "Home and Decor",
      marca: "Bambu Home",
      certs: ["FSC"],
    },
  ];

  const existingProductsTotal = await prisma.produto.count();
  if (existingProductsTotal > 0) {
    console.log(
      `Catalog already has ${existingProductsTotal} product(s); skipping creation ` +
        "(idempotent seed, REQ-OPS-03 — existing products are never deleted).",
    );
  } else {
    for (const prod of productsInput) {
      const fixedName = prod.nome || (prod as any).row;

      await prisma.produto.create({
        data: {
          nome: fixedName as string,
          descricao: prod.descricao,
          preco: prod.preco,
          categoriaId: categories[prod.categoria],
          marcaId: brands[prod.marca],
          certificados: {
            create: prod.certs.map((certificateName) => ({
              certificadoId: certificates[certificateName],
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
