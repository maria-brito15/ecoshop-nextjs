// Capacidade SCAN — docs/capabilities/ecoscan/spec.md
import {
  email,
  createUserDirectly,
  cookieDe,
  req,
  stubFetch,
  json,
  closeConnections,
} from "./helpers";
import { test, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as scan } from "@/app/api/ia/scan/route";

after(closeConnections);

let restaurar: (() => void) | undefined;
beforeEach(() => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
});
afterEach(() => restaurar?.());

const CAMPOS = [
  "impacto_ambiental",
  "tempo_decomposicao",
  "onde_descartar",
  "reciclabilidade",
  "dicas_sustentaveis",
  "beneficios_reciclagem",
];
const geminiAnalysis = () =>
  json({
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify(
                Object.fromEntries(CAMPOS.map((c) => [c, `texto de ${c}`])),
              ),
            },
          ],
        },
      },
    ],
  });
const azure = (tag: string, p: number) =>
  json({
    predictions: [
      { tagName: tag, probability: p },
      { tagName: "outros", probability: 1 - p },
    ],
  });
const ehAzure = (url: string) => url.startsWith("https://azure.test");

async function submit(file: File | null) {
  const u = await createUserDirectly(email("scan"), "CLIENTE");
  const form = new FormData();
  if (file) form.set("image", file);
  return scan(
    req("/api/ia/scan", { method: "POST", cookie: await cookieDe(u), form }),
  );
}
const png = () =>
  new File([new Uint8Array([137, 80, 78, 71])], "foto.png", {
    type: "image/png",
  });

test("REQ-SCAN-01: material identificado com confiança suficiente devolve a análise de 6 campos", async () => {
  restaurar = stubFetch((url) =>
    ehAzure(url) ? azure("plastico", 0.93) : geminiAnalysis(),
  );
  const res = await submit(png());
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.sucesso, true);
  assert.equal(c.material, "plastico");
  assert.equal(c.confianca, 93);
  for (const campo of CAMPOS)
    assert.ok(c.analise_sustentabilidade[campo], campo);
});

test("REQ-SCAN-02: confiança abaixo do limiar responde 422 sem chamar o Gemini", async () => {
  let chamouGemini = false;
  restaurar = stubFetch((url) => {
    if (!ehAzure(url)) chamouGemini = true;
    return json({ predictions: [{ tagName: "vidro", probability: 0.4 }] });
  });
  const res = await submit(png());
  assert.equal(res.status, 422);
  const c = await res.json();
  assert.equal(c.sucesso, false);
  assert.equal(c.confianca, 40);
  assert.equal(chamouGemini, false);
});

test("REQ-SCAN-03: a tag 'outros' nunca é considerada identificação, mesmo com confiança alta", async () => {
  restaurar = stubFetch(() => azure("outros", 0.99));
  assert.equal((await submit(png())).status, 422);
});

test("REQ-SCAN-04: se o Gemini devolve conteúdo inválido, usa a análise de contingência (200)", async () => {
  restaurar = stubFetch((url) =>
    ehAzure(url)
      ? azure("papel", 0.9)
      : json({
          candidates: [{ content: { parts: [{ text: "isto não é JSON" }] } }],
        }),
  );
  const res = await submit(png());
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.sucesso, true);
  assert.match(c.analise_sustentabilidade.impacto_ambiental, /papel/);
});

test("REQ-SCAN-05: se a rede do Gemini falha, usa a análise de contingência (200)", async () => {
  restaurar = stubFetch((url) => {
    if (ehAzure(url)) return azure("metal", 0.9);
    throw new TypeError("fetch failed");
  });
  assert.equal((await submit(png())).status, 200);
});

test("REQ-SCAN-06: arquivo ausente, formato inválido ou acima de 10 MB responde 400", async () => {
  restaurar = stubFetch(() => azure("papel", 0.9));
  assert.equal((await submit(null)).status, 400);
  assert.equal(
    (await submit(new File(["x"], "a.txt", { type: "text/plain" }))).status,
    400,
  );
  assert.equal(
    (
      await submit(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.png", {
          type: "image/png",
        }),
      )
    ).status,
    400,
  );
});

test("REQ-SCAN-07: se o Azure não responde, a resposta é 422 com sugestão (não 500)", async () => {
  restaurar = stubFetch(() => json({}, 500));
  const res = await submit(png());
  assert.equal(res.status, 422);
  assert.equal((await res.json()).sucesso, false);
});
