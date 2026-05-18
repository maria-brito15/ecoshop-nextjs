// services/marca.service.ts

/**
 * ============================================================================
 * MARCA SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de marcas.
 *
 * Marcas representam fabricantes/empresas parceiras da EcoShop.
 * Cada marca está associada a um usuário do tipo "MARCA" ou "ADMIN".
 *
 * Relacionamentos:
 * - 1:1 com Usuario (usuário responsável pela marca)
 * - 1:N com Produto (uma marca pode ter múltiplos produtos)
 *
 * Cache strategy:
 * - LISTA_CURTA (5 min) para listagens completas
 * - ITEM (3 min) para marcas individuais
 * - Invalidação em write: todas as chaves com prefixo "marcas:*"
 *
 * @see lib/cache/keys.ts - Funções de geração de chaves
 * @see lib/cache/ttl.ts - Constantes de TTL
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import {
  comCache,
  invalidarCache,
  invalidarChave,
  chaveMarcas,
  chaveMarca,
  TTL,
} from "@/lib/cache";

/**
 * Lista todas as marcas ordenadas por nome.
 * Endpoint público - usuários podem ver marcas antes de comprar.
 *
 * Cache: LISTA_CURTA (5 minutos)
 * Chave: "marcas:lista"
 *
 * Inclui dados resumidos do usuário responsável (id, nome, email).
 *
 * @returns Array de marcas com dados do usuário associado
 */
export async function listarMarcas() {
  return comCache(chaveMarcas(), TTL.LISTA_CURTA, () =>
    prisma.marca.findMany({
      orderBy: { nome: "asc" },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    }),
  );
}

/**
 * Busca uma marca pelo ID.
 *
 * Inclui:
 * - Dados do usuário responsável
 * - Lista de produtos da marca
 *
 * @param id - ID da marca
 * @returns Marca encontrada com relacionamentos ou null
 */
export async function buscarMarca(id: number) {
  return comCache(chaveMarca(id), TTL.ITEM, () =>
    prisma.marca.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        produtos: true,
      },
    }),
  );
}

/**
 * Cria uma nova marca.
 * Requer autenticação ADMIN.
 *
 * @param data - Dados da marca
 * @param data.nome - Nome da marca (ex: "EcoBrand")
 * @param data.descricao - Descrição opcional da marca
 * @param data.usuarioId - ID do usuário responsável (tipo MARCA ou ADMIN)
 * @returns Marca recém-criada com dados do usuário
 *
 * @example
 * const marca = await criarMarca({
 *   nome: "EcoBrand",
 *   descricao: "Roupas sustentáveis",
 *   usuarioId: 5
 * });
 */
export async function criarMarca(data: {
  nome: string;
  descricao?: string;
  usuarioId: number;
}) {
  const marca = await prisma.marca.create({
    data,
    include: { usuario: { select: { id: true, nome: true } } },
  });
  await invalidarCache("MARCAS");
  return marca;
}

/**
 * Atualiza uma marca existente.
 * Requer autenticação ADMIN.
 *
 * NOTA: usuarioId NÃO pode ser alterado após a criação.
 * Para transferir responsabilidade, um admin deve criar uma nova marca.
 *
 * @param id - ID da marca a ser atualizada
 * @param data - Dados para atualização (nome, descrição - ambos opcionais)
 * @returns Marca atualizada
 * @throws Error P2025 se marca não existir
 */
export async function atualizarMarca(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const marca = await prisma.marca.update({ where: { id }, data });
  await Promise.all([invalidarChave(chaveMarca(id)), invalidarCache("MARCAS")]);
  return marca;
}

/**
 * Deleta uma marca.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Marcas com produtos associados NÃO podem ser deletadas
 * devido à constraint de chave estrangeira no banco.
 *
 * @param id - ID da marca a ser deletada
 * @returns true se deletado com sucesso
 * @throws Error P2025 se marca não existir
 * @throws Error P2003 se marca possui produtos vinculados
 */
export async function deletarMarca(id: number) {
  const marca = await prisma.marca.findUnique({ where: { id } });
  if (!marca) {
    throw new Error("P2025");
  }

  await prisma.marca.delete({ where: { id } });
  await Promise.all([invalidarChave(chaveMarca(id)), invalidarCache("MARCAS")]);
  return true;
}
