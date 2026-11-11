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
import {
  detectarTipoDeImagem,
  extensaoCombinaComTipo,
} from "@/lib/media/tipo-de-imagem";

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

export type MotivoDeFalhaNoUpload =
  | "PRODUTO_NAO_ENCONTRADO"
  | "EXTENSAO_NAO_PERMITIDA"
  | "ARQUIVO_MUITO_GRANDE"
  | "CONTEUDO_NAO_E_IMAGEM"
  | "NOME_JA_EXISTE";

export type ResultadoDoUpload =
  | { ok: true; foto: { nome: string; url: string } }
  | { ok: false; motivo: MotivoDeFalhaNoUpload };

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
export async function gravarFoto(params: {
  produtoId: number;
  arquivo: File;
  nomeCustomizado?: string | null;
  diretorio: string;
}): Promise<ResultadoDoUpload> {
  const { produtoId, arquivo, nomeCustomizado, diretorio } = params;

  if (!validarExtensao(arquivo.name)) {
    return { ok: false, motivo: "EXTENSAO_NAO_PERMITIDA" };
  }

  if (arquivo.size > MAX_FILE_SIZE) {
    return { ok: false, motivo: "ARQUIVO_MUITO_GRANDE" };
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const tipo = detectarTipoDeImagem(buffer);
  if (!tipo || !extensaoCombinaComTipo(path.extname(arquivo.name), tipo)) {
    return { ok: false, motivo: "CONTEUDO_NAO_E_IMAGEM" };
  }

  const nomeArquivo = sanitizarNome(produtoId, arquivo.name, nomeCustomizado);

  await fs.mkdir(diretorio, { recursive: true });
  try {
    await fs.writeFile(path.join(diretorio, nomeArquivo), buffer, { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      return { ok: false, motivo: "NOME_JA_EXISTE" };
    }
    throw err;
  }

  return {
    ok: true,
    foto: { nome: nomeArquivo, url: `/data_fotos/${nomeArquivo}` },
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
export async function uploadFoto(params: {
  produtoId: number;
  arquivo: File;
  nomeCustomizado?: string | null;
}): Promise<ResultadoDoUpload> {
  const produto = await prisma.produto.findUnique({
    where: { id: params.produtoId },
    select: { id: true },
  });
  if (!produto) return { ok: false, motivo: "PRODUTO_NAO_ENCONTRADO" };

  const resultado = await gravarFoto({ ...params, diretorio: FOTOS_DIR });
  if (resultado.ok) await invalidarCache("FOTOS");
  return resultado;
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
}): Promise<
  | { ok: true }
  | { ok: false; motivo: "NOME_INVALIDO" | "ARQUIVO_NAO_ENCONTRADO" }
> {
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
