/**
 * Spec 014: product media — real image content and exclusive write.
 * Needs no database: uses `gravarFoto` with a temporary folder.
 */
import { closeConnections } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectImageType, extensionMatchesType } from "@/lib/media/image-type";
import { savePhoto } from "@/services/photo.service";

after(closeConnections);

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const GIF = Buffer.from("GIF89a\x01\x00\x01\x00", "latin1");
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([4, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
const HTML = Buffer.from("<html><script>alert(1)</script></html>");

const file = (name: string, content: Buffer) => new File([new Uint8Array(content)], name);

function withFolder<T>(fn: (dir: string) => Promise<T>) {
  const dir = mkdtempSync(join(tmpdir(), "ecoshop-fotos-"));
  return fn(join(dir, "data_fotos")).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("REQ-MIDIA-06: detectImageType recognizes JPEG, PNG, GIF and WebP by byte signature", () => {
  assert.equal(detectImageType(JPEG), "jpeg");
  assert.equal(detectImageType(PNG), "png");
  assert.equal(detectImageType(GIF), "gif");
  assert.equal(detectImageType(WEBP), "webp");
  assert.equal(detectImageType(HTML), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null, "curto demais");
  // RIFF that is not WebP (e.g. WAV)
  assert.equal(detectImageType(Buffer.concat([Buffer.from("RIFF"), Buffer.from([4, 0, 0, 0]), Buffer.from("WAVEfmt ")])), null);
});

test("REQ-MIDIA-06: the extension must match the detected type", () => {
  assert.equal(extensionMatchesType(".JPG", "jpeg"), true);
  assert.equal(extensionMatchesType(".jpeg", "jpeg"), true);
  assert.equal(extensionMatchesType(".png", "jpeg"), false);
  assert.equal(extensionMatchesType(".gif", "png"), false);
});

test("REQ-MIDIA-06: a file with an image extension but non-image content is refused and nothing is written", async () => {
  await withFolder(async (dir) => {
    for (const [name, content] of [
      ["fake.png", HTML],
      ["fake.jpg", PNG], // é uma imagem, mas de outro tipo que o da extensão
      ["vazio.webp", Buffer.alloc(0)],
    ] as const) {
      const r = await savePhoto({ produtoId: 7, arquivo: file(name, content), directory: dir });
      assert.deepEqual(r, { ok: false, reason: "CONTENT_NOT_IMAGE" }, name);
    }
    assert.ok(!existsSync(dir) || readdirSync(dir).length === 0, "no file may have been written");
  });
});

test("REQ-MIDIA-06: valid images of the four types are written with intact content", async () => {
  await withFolder(async (dir) => {
    for (const [name, content] of [["a.jpg", JPEG], ["b.png", PNG], ["c.gif", GIF], ["d.webp", WEBP]] as const) {
      const r = await savePhoto({ produtoId: 7, arquivo: file(name, content), nomeCustomizado: name.replace(".", "_"), directory: dir });
      assert.equal(r.ok, true, name);
      if (r.ok) assert.deepEqual(readFileSync(join(dir, r.photo.nome)), content);
    }
  });
});

test("REQ-MIDIA-06: an extension outside the list and a file above 5 MB are still refused", async () => {
  await withFolder(async (dir) => {
    const svg = await savePhoto({ produtoId: 7, arquivo: file("x.svg", HTML), directory: dir });
    assert.deepEqual(svg, { ok: false, reason: "EXTENSION_NOT_ALLOWED" });
    const large = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const r = await savePhoto({ produtoId: 7, arquivo: file("grande.png", large), directory: dir });
    assert.deepEqual(r, { ok: false, reason: "FILE_TOO_LARGE" });
  });
});

test("REQ-MIDIA-07: two simultaneous uploads with the same name write only one and the other gets NAME_ALREADY_EXISTS, without overwriting", async () => {
  await withFolder(async (dir) => {
    const sameName = (content: Buffer) =>
      savePhoto({ produtoId: 9, arquivo: file("f.png", content), nomeCustomizado: "capa", directory: dir });
    const onePng = Buffer.concat([PNG, Buffer.from("A")]);
    const otherPng = Buffer.concat([PNG, Buffer.from("B")]);
    const results = await Promise.all([sameName(onePng), sameName(otherPng)]);

    const ok = results.filter((r) => r.ok);
    const conflict = results.filter((r) => !r.ok && r.reason === "NAME_ALREADY_EXISTS");
    assert.equal(ok.length, 1);
    assert.equal(conflict.length, 1);
    assert.equal(readdirSync(dir).length, 1);
  });
});
