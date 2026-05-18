// services/certificado.service.ts

/**
 * ============================================================================
 * CERTIFICADO SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de certificados de sustentabilidade.
 *
 * Certificados são selos que atestam que um produto atende a padrões ambientais.
 * Exemplos: "FSC", "Orgânico Brasil", "Cruelty Free", "Eureciclo".
 *
 * Relacionamentos:
 * - Muitos-para-muitos com Produtos (via ProdutoCertificado)
 * - Um certificado pode ser atribuído a múltiplos produtos
 *
 * Cache strategy:
 * - LISTA_CURTA (5 min) para listagens completas
 * - ITEM (3 min) para certificados individuais
 * - Invalidação em write: todas as chaves com prefixo "certificados:*"
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
  chaveCertificados,
  chaveCertificado,
  TTL,
} from "@/lib/cache";

/**
 * Lista todos os certificados ordenados por nome.
 * Endpoint público - certificações são exibidas nos produtos.
 *
 * Cache: LISTA_CURTA (5 minutos)
 * Chave: "certificados:lista"
 *
 * @returns Array de certificados ordenados alfabeticamente por nome
 */
export async function listarCertificados() {
  return comCache(chaveCertificados(), TTL.LISTA_CURTA, () =>
    prisma.certificado.findMany({ orderBy: { nome: "asc" } }),
  );
}

/**
 * Busca um certificado pelo ID.
 *
 * @param id - ID do certificado
 * @returns Certificado encontrado ou null
 */
export async function buscarCertificado(id: number) {
  return comCache(chaveCertificado(id), TTL.ITEM, () =>
    prisma.certificado.findUnique({ where: { id } }),
  );
}

/**
 * Cria um novo certificado.
 * Requer autenticação ADMIN.
 *
 * @param data - Dados do certificado
 * @param data.nome - Nome do certificado (ex: "Cruelty Free")
 * @param data.descricao - Descrição opcional do que o selo garante
 * @param data.orgaoEmissor - Entidade responsável (ex: "PETA", "SisOrg")
 * @returns Certificado recém-criado
 *
 * @example
 * const certificado = await criarCertificado({
 *   nome: "Cruelty Free",
 *   descricao: "Não testado em animais",
 *   orgaoEmissor: "PETA"
 * });
 */
export async function criarCertificado(data: {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
}) {
  const certificado = await prisma.certificado.create({ data });
  await invalidarCache("CERTIFICADOS");
  return certificado;
}

/**
 * Atualiza um certificado existente.
 * Requer autenticação ADMIN.
 *
 * @param id - ID do certificado a ser atualizado
 * @param data - Dados para atualização (todos opcionais)
 * @returns Certificado atualizado
 * @throws Error P2025 se certificado não existir
 */
export async function atualizarCertificado(
  id: number,
  data: { nome?: string; descricao?: string; orgaoEmissor?: string },
) {
  const certificado = await prisma.certificado.update({ where: { id }, data });
  await Promise.all([
    invalidarChave(chaveCertificado(id)),
    invalidarCache("CERTIFICADOS"),
  ]);
  return certificado;
}

/**
 * Deleta um certificado.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Certificados associados a produtos NÃO podem ser deletados
 * devido à constraint de chave estrangeira no banco.
 *
 * @param id - ID do certificado a ser deletado
 * @returns true se deletado com sucesso
 * @throws Error P2025 se certificado não existir
 * @throws Error P2003 se certificado possui produtos vinculados
 */
export async function deletarCertificado(id: number) {
  const certificado = await prisma.certificado.findUnique({ where: { id } });
  if (!certificado) {
    throw new Error("P2025");
  }

  await prisma.certificado.delete({ where: { id } });
  await Promise.all([
    invalidarChave(chaveCertificado(id)),
    invalidarCache("CERTIFICADOS"),
  ]);
  return true;
}
