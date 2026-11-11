// services/photo.service.ts

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
import { invalidateCache } from "@/lib/cache";
import {
  detectImageType,
  extensionMatchesType,
} from "@/lib/media/image-type";

/**
 * Diretório onde as fotos são armazenadas.
 * Caminho absoluto para evitar ambiguidade.
 */
const PHOTOS_DIR = path.join(process.cwd(), "public/data_fotos");

/**
 * Tamanho máximo do arquivo: 5MB.
 * Valor escolhido para balancear qualidade da imagem e performance.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Extensões de arquivo permitidas (whitelist).
 * Todas são formatos comuns em câmeras de smartphones.
 */
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Valida se a extensão do arquivo está na whitelist.
 *
 * @param filename - Nome do arquivo (ex: "foto.jpg")
 * @returns true se extensão é permitida
 */
function hasAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Gera um nome sanitizado e único para o arquivo.
 *
 * Formato: {produtoId}_{customizado ou timestamp_random}.{ext}
 * Exemplo: "123_meu_produto_foto.jpg" ou "123_1702900000_abc123.jpg"
 *
 * @param productId - ID do produto associado
 * @param originalName - Nome original do arquivo (para extrair extensão)
 * @param custom - Nome personalizado opcional (sanitizado)
 * @returns Nome sanitizado e único
 */
function buildFileName(
  productId: number,
  originalName: string,
  custom?: string | null,
): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = custom
    ? custom.replace(/[^a-zA-Z0-9]/g, "_")
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${productId}_${base}${ext}`;
}

/**
 * Lista todas as fotos de um produto.
 *
 * @param productId - ID do produto
 * @returns Objeto com array de fotos, total e produtoId
 */
export async function listPhotos(productId: number) {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    const photos = files
      .filter((file) => file.startsWith(`${productId}_`))
      .map((name) => ({ nome: name, url: `/data_fotos/${name}` }));
    return { fotos: photos, total: photos.length, produtoId: productId };
  } catch {
    // Diretório não existe ou erro de leitura
    return { fotos: [], total: 0, produtoId: productId };
  }
}

export type UploadFailureReason =
  | "PRODUCT_NOT_FOUND"
  | "EXTENSION_NOT_ALLOWED"
  | "FILE_TOO_LARGE"
  | "CONTENT_NOT_IMAGE"
  | "NAME_ALREADY_EXISTS";

export type UploadResult =
  | { ok: true; photo: { nome: string; url: string } }
  | { ok: false; reason: UploadFailureReason };

/**
 * Valida e grava a foto em `diretorio` (sem acesso ao banco; exportada para teste).
 *
 * Fluxo: extensão → tamanho → CONTEÚDO real (assinatura dos bytes, REQ-MIDIA-06)
 * → nome sanitizado → gravação exclusiva.
 *
 * A gravação usa a flag `wx` (falha se o arquivo já existe): decide a corrida
 * entre dois uploads simultâneos com o mesmo nome, em vez de checar a listagem do
 * diretório antes e sobrescrever depois (REQ-MIDIA-07).
 */
export async function savePhoto(params: {
  produtoId: number;
  arquivo: File;
  nomeCustomizado?: string | null;
  directory: string;
}): Promise<UploadResult> {
  const { produtoId: productId, arquivo: file, nomeCustomizado: customName, directory: directory } = params;

  if (!hasAllowedExtension(file.name)) {
    return { ok: false, reason: "EXTENSION_NOT_ALLOWED" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: "FILE_TOO_LARGE" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type || !extensionMatchesType(path.extname(file.name), type)) {
    return { ok: false, reason: "CONTENT_NOT_IMAGE" };
  }

  const fileName = buildFileName(productId, file.name, customName);

  await fs.mkdir(directory, { recursive: true });
  try {
    await fs.writeFile(path.join(directory, fileName), buffer, { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      return { ok: false, reason: "NAME_ALREADY_EXISTS" };
    }
    throw err;
  }

  return {
    ok: true,
    photo: { nome: fileName, url: `/data_fotos/${fileName}` },
  };
}

/**
 * Faz upload de uma nova foto para um produto.
 *
 * Fluxo: verifica se o produto existe → `gravarFoto` → invalida o cache de fotos.
 *
 * @param params - Parâmetros do upload
 * @returns Resultado da operação (ok com foto ou erro com motivo)
 */
export async function uploadPhoto(params: {
  produtoId: number;
  arquivo: File;
  nomeCustomizado?: string | null;
}): Promise<UploadResult> {
  const product = await prisma.produto.findUnique({
    where: { id: params.produtoId },
    select: { id: true },
  });
  if (!product) return { ok: false, reason: "PRODUCT_NOT_FOUND" };

  const result = await savePhoto({ ...params, directory: PHOTOS_DIR });
  if (result.ok) await invalidateCache("PHOTOS");
  return result;
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
export async function deletePhoto(params: {
  produtoId: number;
  nomeArquivo: string;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "INVALID_NAME" | "FILE_NOT_FOUND" }
> {
  const { produtoId: productId, nomeArquivo: fileName } = params;

  // Valida se o arquivo pertence ao produto
  if (!fileName.startsWith(`${productId}_`)) {
    return { ok: false, reason: "INVALID_NAME" };
  }

  // Proteção contra path traversal
  const sanitizedName = path.basename(fileName);
  if (
    sanitizedName !== fileName ||
    sanitizedName === "." ||
    sanitizedName === ".."
  ) {
    return { ok: false, reason: "INVALID_NAME" };
  }

  const filePath = path.join(PHOTOS_DIR, sanitizedName);

  // Verifica se arquivo existe
  try {
    await fs.access(filePath);
  } catch {
    return { ok: false, reason: "FILE_NOT_FOUND" };
  }

  // Deleta arquivo
  await fs.unlink(filePath);
  await invalidateCache("PHOTOS");

  return { ok: true };
}
