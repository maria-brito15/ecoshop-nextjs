/**
 * Spec 014: mídia de produto — conteúdo real da imagem e gravação exclusiva.
 * Não precisa de banco: usa `gravarFoto` com uma pasta temporária.
 */
import { encerrar } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectarTipoDeImagem, extensaoCombinaComTipo } from "@/lib/media/tipo-de-imagem";
import { gravarFoto } from "@/services/foto.service";

after(encerrar);

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const GIF = Buffer.from("GIF89a\x01\x00\x01\x00", "latin1");
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([4, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
const HTML = Buffer.from("<html><script>alert(1)</script></html>");

const arquivo = (nome: string, conteudo: Buffer) => new File([new Uint8Array(conteudo)], nome);

function comPasta<T>(fn: (dir: string) => Promise<T>) {
  const dir = mkdtempSync(join(tmpdir(), "ecoshop-fotos-"));
  return fn(join(dir, "data_fotos")).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("REQ-MIDIA-06: detectarTipoDeImagem reconhece JPEG, PNG, GIF e WebP pela assinatura dos bytes", () => {
  assert.equal(detectarTipoDeImagem(JPEG), "jpeg");
  assert.equal(detectarTipoDeImagem(PNG), "png");
  assert.equal(detectarTipoDeImagem(GIF), "gif");
  assert.equal(detectarTipoDeImagem(WEBP), "webp");
  assert.equal(detectarTipoDeImagem(HTML), null);
  assert.equal(detectarTipoDeImagem(Buffer.alloc(0)), null);
  assert.equal(detectarTipoDeImagem(Buffer.from([0xff, 0xd8])), null, "curto demais");
  // RIFF que não é WebP (ex.: WAV)
  assert.equal(detectarTipoDeImagem(Buffer.concat([Buffer.from("RIFF"), Buffer.from([4, 0, 0, 0]), Buffer.from("WAVEfmt ")])), null);
});

test("REQ-MIDIA-06: a extensão precisa combinar com o tipo detectado", () => {
  assert.equal(extensaoCombinaComTipo(".JPG", "jpeg"), true);
  assert.equal(extensaoCombinaComTipo(".jpeg", "jpeg"), true);
  assert.equal(extensaoCombinaComTipo(".png", "jpeg"), false);
  assert.equal(extensaoCombinaComTipo(".gif", "png"), false);
});

test("REQ-MIDIA-06: arquivo com extensão de imagem mas conteúdo que não é imagem é recusado e nada é gravado", async () => {
  await comPasta(async (dir) => {
    for (const [nome, conteudo] of [
      ["fake.png", HTML],
      ["fake.jpg", PNG], // é uma imagem, mas de outro tipo que o da extensão
      ["vazio.webp", Buffer.alloc(0)],
    ] as const) {
      const r = await gravarFoto({ produtoId: 7, arquivo: arquivo(nome, conteudo), diretorio: dir });
      assert.deepEqual(r, { ok: false, motivo: "CONTEUDO_NAO_E_IMAGEM" }, nome);
    }
    assert.ok(!existsSync(dir) || readdirSync(dir).length === 0, "nenhum arquivo pode ter sido gravado");
  });
});

test("REQ-MIDIA-06: imagens válidas dos quatro tipos são gravadas com o conteúdo intacto", async () => {
  await comPasta(async (dir) => {
    for (const [nome, conteudo] of [["a.jpg", JPEG], ["b.png", PNG], ["c.gif", GIF], ["d.webp", WEBP]] as const) {
      const r = await gravarFoto({ produtoId: 7, arquivo: arquivo(nome, conteudo), nomeCustomizado: nome.replace(".", "_"), diretorio: dir });
      assert.equal(r.ok, true, nome);
      if (r.ok) assert.deepEqual(readFileSync(join(dir, r.foto.nome)), conteudo);
    }
  });
});

test("REQ-MIDIA-06: extensão fora da lista e arquivo acima de 5 MB continuam sendo recusados", async () => {
  await comPasta(async (dir) => {
    const svg = await gravarFoto({ produtoId: 7, arquivo: arquivo("x.svg", HTML), diretorio: dir });
    assert.deepEqual(svg, { ok: false, motivo: "EXTENSAO_NAO_PERMITIDA" });
    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const r = await gravarFoto({ produtoId: 7, arquivo: arquivo("grande.png", grande), diretorio: dir });
    assert.deepEqual(r, { ok: false, motivo: "ARQUIVO_MUITO_GRANDE" });
  });
});

test("REQ-MIDIA-07: dois uploads simultâneos com o mesmo nome gravam um só e o outro recebe NOME_JA_EXISTE, sem sobrescrever", async () => {
  await comPasta(async (dir) => {
    const mesmoNome = (conteudo: Buffer) =>
      gravarFoto({ produtoId: 9, arquivo: arquivo("f.png", conteudo), nomeCustomizado: "capa", diretorio: dir });
    const umPng = Buffer.concat([PNG, Buffer.from("A")]);
    const outroPng = Buffer.concat([PNG, Buffer.from("B")]);
    const resultados = await Promise.all([mesmoNome(umPng), mesmoNome(outroPng)]);

    const ok = resultados.filter((r) => r.ok);
    const conflito = resultados.filter((r) => !r.ok && r.motivo === "NOME_JA_EXISTE");
    assert.equal(ok.length, 1);
    assert.equal(conflito.length, 1);
    assert.equal(readdirSync(dir).length, 1);
  });
});
