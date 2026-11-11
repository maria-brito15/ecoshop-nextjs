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
import { ResourceNotFound } from "@/lib/errors/dominio";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  certificatesKey,
  certificateKey,
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
export async function listCertificates() {
  return withCache(certificatesKey(), TTL.SHORT_LIST, () =>
    prisma.certificado.findMany({ orderBy: { nome: "asc" } }),
  );
}

/**
 * Busca um certificado pelo ID.
 *
 * @param id - ID do certificado
 * @returns Certificado encontrado ou null
 */
export async function getCertificate(id: number) {
  return withCache(certificateKey(id), TTL.ITEM, () =>
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
export async function createCertificate(data: {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
}) {
  const certificate = await prisma.certificado.create({ data });
  await invalidateCache("CERTIFICATES");
  return certificate;
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
export async function updateCertificate(
  id: number,
  data: { nome?: string; descricao?: string; orgaoEmissor?: string },
) {
  const certificate = await prisma.certificado.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(certificateKey(id)),
    invalidateCache("CERTIFICATES"),
  ]);
  return certificate;
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
export async function deleteCertificate(id: number) {
  const certificate = await prisma.certificado.findUnique({ where: { id } });
  if (!certificate) {
    throw new ResourceNotFound("Certificado");
  }

  await prisma.certificado.delete({ where: { id } });
  await Promise.all([
    invalidateKey(certificateKey(id)),
    invalidateCache("CERTIFICATES"),
  ]);
  return true;
}
