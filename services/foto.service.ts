// services/foto.service.ts

/**
 * ============================================================================
 * FOTO SERVICE
 * ============================================================================
 * Serviço para gerenciamento de fotos de produtos.
 *
 * As fotos são armazenadas no sistema de arquivos (public/data_fotos/)
 * e servidas como arquivos estáticos pelo Next.js.
 *
 * Regras de negócio:
 * - Extensões permitidas: .jpg, .jpeg, .png, .gif, .webp
 * - Tamanho máximo: 5MB
 * - Nomes sanitizados para evitar colisões e path traversal
 * - Formato do nome: {produtoId}_{timestamp}_{random}.{ext}
 *
 * Segurança:
 * - Validação de extensão (whitelist)
 * - Validação de tamanho (5MB max)
 * - Sanitização de nomes (remove caracteres especiais)
 * - Proteção contra path traversal (path.basename)
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
 * ============================================================================
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { invalidarCache } from "@/lib/cache";

/**
 * Diretório onde as fotos são armazenadas.
 * Caminho absoluto para evitar ambiguidade.
 */
const FOTOS_DIR = path.join(process.cwd(), "public/data_fotos");

/**
 * Tamanho máximo do arquivo: 5MB.
 * Valor escolhido para balancear qualidade da imagem e performance.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Extensões de arquivo permitidas (whitelist).
 * Todas são formatos comuns em câmeras de smartphones.
 */
export const EXTENSOES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Valida se a extensão do arquivo está na whitelist.
 *
 * @param filename - Nome do arquivo (ex: "foto.jpg")
 * @returns true se extensão é permitida
 */
function validarExtensao(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return EXTENSOES_PERMITIDAS.includes(ext);
}

/**
 * Gera um nome sanitizado e único para o arquivo.
 *
 * Formato: {produtoId}_{customizado ou timestamp_random}.{ext}
 * Exemplo: "123_meu_produto_foto.jpg" ou "123_1702900000_abc123.jpg"
 *
 * @param produtoId - ID do produto associado
 * @param nomeOriginal - Nome original do arquivo (para extrair extensão)
 * @param customizado - Nome personalizado opcional (sanitizado)
 * @returns Nome sanitizado e único
 */
function sanitizarNome(
  produtoId: number,
  nomeOriginal: string,
  customizado?: string | null,
): string {
  const ext = path.extname(nomeOriginal).toLowerCase();
  const base = customizado
    ? customizado.replace(/[^a-zA-Z0-9]/g, "_")
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${produtoId}_${base}${ext}`;
}

/**
 * Lista todas as fotos de um produto.
 *
 * @param produtoId - ID do produto
 * @returns Objeto com array de fotos, total e produtoId
 */
export async function listarFotos(produtoId: number) {
  try {
    const files = await fs.readdir(FOTOS_DIR);
    const fotos = files
      .filter((file) => file.startsWith(`${produtoId}_`))
      .map((nome) => ({ nome, url: `/data_fotos/${nome}` }));
    return { fotos, total: fotos.length, produtoId };
  } catch {
    // Diretório não existe ou erro de leitura
    return { fotos: [], total: 0, produtoId };
  }
}

/**
 * Faz upload de uma nova foto para um produto.
 *
 * Fluxo:
 * 1. Verifica se produto existe
 * 2. Valida extensão do arquivo
 * 3. Valida tamanho do arquivo
 * 4. Sanitiza nome do arquivo
 * 5. Verifica se já existe arquivo com mesmo nome
 * 6. Salva arquivo no sistema de arquivos
 * 7. Invalida cache de fotos
 *
 * @param params - Parâmetros do upload
 * @returns Resultado da operação (ok com foto ou erro com motivo)
 */
export async function uploadFoto(params: {
  produtoId: number;
  arquivo: File;
  nomeCustomizado?: string | null;
}) {
  const { produtoId, arquivo, nomeCustomizado } = params;

  // Verifica se produto existe
  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) return { ok: false, motivo: "PRODUTO_NAO_ENCONTRADO" };

  // Valida extensão
  if (!validarExtensao(arquivo.name)) {
    return { ok: false, motivo: "EXTENSAO_NAO_PERMITIDA" };
  }

  // Valida tamanho
  if (arquivo.size > MAX_FILE_SIZE) {
    return { ok: false, motivo: "ARQUIVO_MUITO_GRANDE" };
  }

  // Gera nome sanitizado
  const nomeArquivo = sanitizarNome(produtoId, arquivo.name, nomeCustomizado);

  // Verifica se arquivo já existe
  const existingFiles = await fs.readdir(FOTOS_DIR).catch(() => [] as string[]);
  if (existingFiles.includes(nomeArquivo)) {
    return { ok: false, motivo: "NOME_JA_EXISTE" };
  }

  // Salva arquivo
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.mkdir(FOTOS_DIR, { recursive: true });
  await fs.writeFile(path.join(FOTOS_DIR, nomeArquivo), buffer);

  // Invalida cache
  await invalidarCache("FOTOS");

  return {
    ok: true,
    foto: { nome: nomeArquivo, url: `/data_fotos/${nomeArquivo}` },
  };
}

/**
 * Deleta uma foto específica de um produto.
 *
 * Validações de segurança:
 * - Nome deve começar com {produtoId}_ (previne deletar fotos de outros produtos)
 * - Usa path.basename para prevenir path traversal
 *
 * @param params - Parâmetros da deleção
 * @returns Resultado da operação (ok ou erro com motivo)
 */
export async function deletarFoto(params: {
  produtoId: number;
  nomeArquivo: string;
}) {
  const { produtoId, nomeArquivo } = params;

  // Valida se o arquivo pertence ao produto
  if (!nomeArquivo.startsWith(`${produtoId}_`)) {
    return { ok: false, motivo: "NOME_INVALIDO" };
  }

  // Proteção contra path traversal
  const nomeSanitizado = path.basename(nomeArquivo);
  if (
    nomeSanitizado !== nomeArquivo ||
    nomeSanitizado === "." ||
    nomeSanitizado === ".."
  ) {
    return { ok: false, motivo: "NOME_INVALIDO" };
  }

  const filePath = path.join(FOTOS_DIR, nomeSanitizado);

  // Verifica se arquivo existe
  try {
    await fs.access(filePath);
  } catch {
    return { ok: false, motivo: "ARQUIVO_NAO_ENCONTRADO" };
  }

  // Deleta arquivo
  await fs.unlink(filePath);
  await invalidarCache("FOTOS");

  return { ok: true };
}
