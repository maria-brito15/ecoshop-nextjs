import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, TipoUsuario } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o povoamento (seed) do banco de dados...\n");

  console.log("Limpando produtos e certificados associados...");
  await prisma.produtoCertificado.deleteMany();
  await prisma.produto.deleteMany();

  console.log("Criando categorias...");
  const categoriasInput = [
    {
      nome: "Roupas Sustentáveis",
      descricao:
        "Vestuário feito com materiais ecológicos, algodão orgânico e tecidos reciclados.",
    },
    {
      nome: "Alimentos Orgânicos",
      descricao:
        "Alimentos livres de agrotóxicos, conservantes e cultivados com respeito ao solo.",
    },
    {
      nome: "Cosméticos Naturais",
      descricao:
        "Maquiagens e cremes veganos, sem parabenos e não testados em animais.",
    },
    {
      nome: "Casa e Decoração",
      descricao:
        "Itens para o lar feitos de bambu, cerâmica artesanal e materiais biodegradáveis.",
    },
    {
      nome: "Calçados Ecológicos",
      descricao:
        "Tênis e sapatos feitos de borracha reciclada e couro vegetal.",
    },
  ];

  const categorias = {} as Record<string, number>;
  for (const cat of categoriasInput) {
    const registro = await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat,
    });
    categorias[registro.nome] = registro.id;
  }

  console.log("Criando certificados...");
  const certificadosInput = [
    {
      nome: "Cruelty Free",
      orgaoEmissor: "PETA",
      descricao:
        "Garante que o produto não foi testado em animais em nenhuma etapa.",
    },
    {
      nome: "Orgânico Brasil",
      orgaoEmissor: "SisOrg",
      descricao: "Certificação nacional oficial para produtos orgânicos.",
    },
    {
      nome: "FSC",
      orgaoEmissor: "Forest Stewardship Council",
      descricao:
        "Garante que a madeira/papel provém de florestas bem manejadas.",
    },
    {
      nome: "Eureciclo",
      orgaoEmissor: "Instituto Eureciclo",
      descricao: "Compensação ambiental das embalagens.",
    },
    {
      nome: "IBD Ingredientes Naturais",
      orgaoEmissor: "IBD Certificações",
      descricao: "Auditoria de ingredientes naturais em cosméticos.",
    },
  ];

  const certificados = {} as Record<string, number>;
  for (const cert of certificadosInput) {
    const registro = await prisma.certificado.upsert({
      where: { nome: cert.nome },
      update: {},
      create: cert,
    });
    certificados[registro.nome] = registro.id;
  }

  console.log("Criando usuários...");
  const usuariosInput = [
    {
      email: "admin@ecoplace.com",
      nome: "Admin Principal",
      senha: "hash-seguro-aqui",
      tipo: TipoUsuario.ADMIN,
    },
    {
      email: "joao@cliente.com",
      nome: "João Silva",
      senha: "hash-seguro-aqui",
      telefone: "11999998888",
      tipo: TipoUsuario.CLIENTE,
    },
    {
      email: "maria@cliente.com",
      nome: "Maria Souza",
      senha: "hash-seguro-aqui",
      telefone: "21988887777",
      tipo: TipoUsuario.CLIENTE,
    },
    {
      email: "contato@ecobrand.com",
      nome: "Lucas (EcoBrand)",
      senha: "hash-seguro-aqui",
      tipo: TipoUsuario.MARCA,
    },
    {
      email: "falecom@pureza.com",
      nome: "Ana (Pureza Naturais)",
      senha: "hash-seguro-aqui",
      tipo: TipoUsuario.MARCA,
    },
    {
      email: "vendas@bambuhome.com",
      nome: "Carlos (Bambu Home)",
      senha: "hash-seguro-aqui",
      tipo: TipoUsuario.MARCA,
    },
  ];

  const usuarios = {} as Record<string, number>;
  for (const user of usuariosInput) {
    const registro = await prisma.usuario.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    usuarios[registro.email] = registro.id;
  }

  console.log("Criando marcas...");
  const marcasInput = [
    {
      nome: "EcoBrand",
      descricao: "A melhor marca sustentável de roupas do mercado nacional.",
      usuarioId: usuarios["contato@ecobrand.com"],
    },
    {
      nome: "Pureza Naturais",
      descricao: "Cosméticos e alimentos 100% orgânicos e saudáveis.",
      usuarioId: usuarios["falecom@pureza.com"],
    },
    {
      nome: "Bambu Home",
      descricao: "Decore sua casa sem destruir o planeta.",
      usuarioId: usuarios["vendas@bambuhome.com"],
    },
  ];

  const marcas = {} as Record<string, number>;
  for (const marca of marcasInput) {
    const registro = await prisma.marca.upsert({
      where: { nome: marca.nome },
      update: {},
      create: marca,
    });
    marcas[registro.nome] = registro.id;
  }

  console.log("Criando catálogo de produtos...");
  const produtosInput = [
    {
      nome: "Camiseta Básica Orgânica",
      descricao: "100% algodão orgânico, tingimento natural.",
      preco: 89.9,
      categoria: "Roupas Sustentáveis",
      marca: "EcoBrand",
      certs: ["Orgânico Brasil", "Eureciclo"],
    },
    {
      nome: "Calça Jeans Reciclada",
      descricao: "Feita a partir de retalhos e plástico retirado do oceano.",
      preco: 199.5,
      categoria: "Roupas Sustentáveis",
      marca: "EcoBrand",
      certs: ["Eureciclo"],
    },
    {
      nome: "Tênis de Couro Vegetal",
      descricao: "Estiloso, durável e feito de casca de abacaxi.",
      preco: 350.0,
      categoria: "Calçados Ecológicos",
      marca: "EcoBrand",
      certs: ["Cruelty Free"],
    },

    {
      nome: "Shampoo Sólido de Alecrim",
      descricao: "Rende até 60 lavagens. Zero plástico.",
      preco: 35.9,
      categoria: "Cosméticos Naturais",
      marca: "Pureza Naturais",
      certs: ["Cruelty Free", "IBD Ingredientes Naturais"],
    },
    {
      nome: "Creme Facial Vegano",
      descricao: "Hidratação profunda com ácido hialurônico vegetal.",
      preco: 120.0,
      categoria: "Cosméticos Naturais",
      marca: "Pureza Naturais",
      certs: ["Cruelty Free", "Eureciclo"],
    },
    {
      nome: "Granola Orgânica Premium",
      descricao: "Mix de castanhas e sementes sem adição de açúcar.",
      preco: 45.0,
      categoria: "Alimentos Orgânicos",
      marca: "Pureza Naturais",
      certs: ["Orgânico Brasil"],
    },
    {
      row: "Café Torrado Especial",
      descricao: "Grãos selecionados de agricultura familiar.",
      preco: 28.5,
      categoria: "Alimentos Orgânicos",
      marca: "Pureza Naturais",
      certs: ["Orgânico Brasil", "FSC"],
    },

    {
      nome: "Kit Escovas de Dente de Bambu",
      descricao: "Pack com 4 escovas 100% biodegradáveis.",
      preco: 40.0,
      categoria: "Casa e Decoração",
      marca: "Bambu Home",
      certs: ["FSC", "Eureciclo"],
    },
    {
      nome: "Copo Sustentável de Fibra",
      descricao: "Leve seu café para qualquer lugar sem gerar lixo.",
      preco: 55.9,
      categoria: "Casa e Decoração",
      marca: "Bambu Home",
      certs: ["Eureciclo"],
    },
    {
      nome: "Organizador de Mesa em Madeira",
      descricao: "Design minimalista feito com madeira de reflorestamento.",
      preco: 110.0,
      categoria: "Casa e Decoração",
      marca: "Bambu Home",
      certs: ["FSC"],
    },
  ];

  for (const prod of produtosInput) {
    const nomeCorrigido = prod.nome || prod.row;

    await prisma.produto.create({
      data: {
        nome: nomeCorrigido as string,
        descricao: prod.descricao,
        preco: prod.preco,
        categoriaId: categorias[prod.categoria],
        marcaId: marcas[prod.marca],
        certificados: {
          create: prod.certs.map((nomeCertificado) => ({
            certificadoId: certificados[nomeCertificado],
          })),
        },
      },
    });
  }

  console.log(
    "\nSeed massivo concluído com sucesso! Banco de dados pronto para testes.",
  );
}

main()
  .catch((e) => {
    console.error("Erro ao executar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
