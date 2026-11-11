// lib/media/tipo-de-imagem.ts

/**
 * Reconhece o tipo REAL de uma imagem pelos primeiros bytes ("assinatura"),
 * em vez de confiar na extensão do nome do arquivo (REQ-MIDIA-06).
 *
 * Um arquivo `.png` que na verdade é HTML ou um executável passa por uma checagem
 * só de extensão; aqui ele é recusado.
 */

export type TipoDeImagem = "jpeg" | "png" | "gif" | "webp";

/** Extensões (em minúsculas, com ponto) que cada tipo aceita. */
export const EXTENSIONS_BY_TYPE: Record<TipoDeImagem, readonly string[]> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  gif: [".gif"],
  webp: [".webp"],
};

const comecaCom = (bytes: Uint8Array, assinatura: readonly number[], deslocamento = 0) =>
  assinatura.every((byte, i) => bytes[deslocamento + i] === byte);

/** @returns o tipo da imagem, ou `null` se os bytes não são JPEG, PNG, GIF nem WebP. */
export function detectImageType(bytes: Uint8Array): TipoDeImagem | null {
  if (comecaCom(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // "GIF87a" ou "GIF89a"
  if (comecaCom(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return "gif";
  }
  // "RIFF" <tamanho de 4 bytes> "WEBP"
  if (comecaCom(bytes, [0x52, 0x49, 0x46, 0x46]) && comecaCom(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  return null;
}

/** A extensão do nome é uma das aceitas pelo tipo detectado? */
export function extensionMatchesType(extensao: string, type: TipoDeImagem): boolean {
  return EXTENSIONS_BY_TYPE[type].includes(extensao.toLowerCase());
}
