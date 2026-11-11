// prisma/seed.ts

/**
 * ============================================================================
 * SEED SCRIPT - POPULAÇÃO INICIAL DO BANCO DE DADOS
 * ============================================================================
 * Script para popular o banco de dados com dados iniciais de desenvolvimento.
 *
 * O que é seed?
 * - Conjunto de dados iniciais inseridos no banco quando a aplicação é configurada
 * - Útil para desenvolvimento, testes e demonstração da plataforma
 *
 * Como executar:
 *   npm run seed
 *   ou
 *   npx prisma db seed
 *
 * Dados criados por este script:
 * - Categorias (5 categorias de produtos sustentáveis)
 * - Certificados (5 certificações ambientais)
 * - Usuários (6 usuários com diferentes perfis: ADMIN, CLIENTE, MARCA)
 * - Marcas (3 marcas parceiras)
 * - Produtos (10 produtos com certificações)
 *
 * IDEMPOTÊNCIA (REQ-OPS-03): categorias, certificados, usuários e marcas usam
 * upsert (sempre seguro repetir). Os produtos só são criados se o catálogo
 * estiver vazio — o seed NUNCA apaga produtos existentes. Antes, este script
 * apagava e recriava os produtos em toda subida (`docker compose up`), e isso
 * destruía qualquer foto ou edição feita depois do primeiro seed.
 * Para resetar de fato, use `prisma migrate reset` (apaga o banco todo).
 *
 * SENHA (REQ-OPS-02): os usuários de demonstração agora recebem um hash
 * bcrypt real (não mais o placeholder "hash-seguro-aqui", que não permitia
 * login de ninguém). A senha é a mesma para todos os usuários de demo e vem
 * **obrigatoriamente** de SEED_USER_PASSWORD (12+ caracteres): não há senha
 * embutida no código (REQ-OPS-09). Este seed é só para desenvolvimento; em
 * produção o catálogo começa vazio e só o ADMIN é criado (seed-admin.ts).
 *
 * @see prisma/schema.prisma - Definição dos modelos
 * @see prisma.config.ts - Configuração do seed
 * ============================================================================
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, TipoUsuario } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { requireSeedPassword } from "./seed-password";

/**
 * Senha em texto plano dos usuários de demonstração (todos compartilham a
 * mesma, por simplicidade). Mesmo custo de hashing usado no resto do app
 * (services/user.service.ts, prisma/seed-admin.ts).
 */
const SEED_USER_PASSWORD = requireSeedPassword(
  "SEED_USER_PASSWORD",
  process.env.SEED_USER_PASSWORD,
);
const SALT_ROUNDS = 12;

/**
 * String de conexão com o banco de dados.
 * Deve estar definida no arquivo .env.local
 */
const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Instância do Prisma Client usando o adapter PostgreSQL.
 * Necessário porque o seed roda fora do contexto da aplicação Next.js.
 */
const prisma = new PrismaClient({ adapter });

/**
 * Função principal de seed.
 * Ordem de execução é importante devido às relações de chave estrangeira:
 * 1. Limpa dados existentes (começa pelas tabelas de relação)
 * 2. Cria categorias
 * 3. Cria certificados
 * 4. Cria usuários
 * 5. Cria marcas (depende de usuários)
 * 6. Cria produtos (depende de categorias e marcas)
 * 7. Associa certificados aos produtos
 */
async function main() {
  console.log("Starting database seeding...\n");

  // ---------------------------------------------------------------------------
  // STEP 2: CATEGORIAS
  // ---------------------------------------------------------------------------
  // Categorias organizam produtos por tipo.
  // Usa upsert para não duplicar se já existirem (idempotência).
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
  // Certificados atestam práticas sustentáveis dos produtos.
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
  // STEP 4: USUÁRIOS
  // ---------------------------------------------------------------------------
  // Cria usuários com diferentes perfis para testar autenticação e permissões.
  // Todos compartilham SEED_USER_PASSWORD (ver topo do arquivo) com hash bcrypt
  // real — antes, a senha era o placeholder "hash-seguro-aqui" e ninguém
  // conseguia logar com nenhum desses usuários (REQ-OPS-02).
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
  // Cada marca está associada a um usuário (relacionamento 1:1).
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
  // Catálogo de produtos sustentáveis com certificações associadas.
  console.log("Creating product catalog...");
  const productsInput = [
    // EcoBrand - Roupas Sustentáveis
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

    // Pureza Naturais - Cosméticos e Alimentos
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

    // Bambu Home - Casa e Decoração
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
 * Executa o seed e trata erros.
 * - Em caso de erro, exibe no console e encerra com código 1
 * - Ao final, desconecta do banco de dados
 */
main()
  .catch((e) => {
    console.error("Error running the seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
