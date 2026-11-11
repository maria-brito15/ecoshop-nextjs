/**
 * Observabilidade mínima (Constitution Art. XIII.1; REQ-OPS-19): erro 5xx deixa
 * rastro estruturado, sem segredo. Não precisa de banco nem de Redis.
 */
import { closeConnections } from "./helpers";
import { test, after, mock } from "node:test";
import assert from "node:assert/strict";
import { log, serializeError, throttle } from "@/lib/log";
import { ERRORS } from "@/lib/http/responses";

after(closeConnections);

/** Captura o que o log escreve (uma linha JSON por chamada) enquanto `fn` roda. */
function capturar(metodo: "log" | "warn" | "error", fn: () => void): Record<string, unknown>[] {
  const espiao = mock.method(console, metodo, () => {});
  try {
    fn();
    return espiao.mock.calls.map((c) => JSON.parse(String(c.arguments[0])));
  } finally {
    espiao.mock.restore();
  }
}

test("REQ-OPS-19: o log é uma linha JSON com data, nível e evento", () => {
  const [linha] = capturar("warn", () => log.warn("teste.evento", { rota: "/api/x", ms: 12 }));
  assert.equal(linha.nivel, "warn");
  assert.equal(linha.evento, "teste.evento");
  assert.equal(linha.rota, "/api/x");
  assert.equal(linha.ms, 12);
  assert.ok(!Number.isNaN(Date.parse(String(linha.ts))));
});

test("REQ-OPS-19: chaves sensíveis do contexto, em qualquer profundidade, viram [REDIGIDO]", () => {
  const [linha] = capturar("log", () =>
    log.info("teste.sensivel", {
      senha: "abc",
      token: "t",
      JWT_SECRET: "s",
      GEMINI_KEY: "k",
      aninhado: { authorization: "Bearer x", cookie: "token=1", ok: "visível" },
      lista: [{ password: "p" }],
    }),
  );
  assert.equal(linha.senha, "[REDIGIDO]");
  assert.equal(linha.token, "[REDIGIDO]");
  assert.equal(linha.JWT_SECRET, "[REDIGIDO]");
  assert.equal(linha.GEMINI_KEY, "[REDIGIDO]");
  assert.deepEqual(linha.aninhado, { authorization: "[REDIGIDO]", cookie: "[REDIGIDO]", ok: "visível" });
  assert.deepEqual(linha.lista, [{ password: "[REDIGIDO]" }]);
});

test("REQ-OPS-19: credenciais dentro de URLs em textos são mascaradas", () => {
  const [linha] = capturar("log", () =>
    log.info("teste.url", { destino: "falhou em redis://:minhasenha@cache:6379/0 e postgresql://usr:pw@db:5432/x" }),
  );
  const text = JSON.stringify(linha);
  assert.ok(!text.includes("minhasenha"));
  assert.ok(!text.includes("usr:pw"));
  assert.match(String(linha.destino), /redis:\/\/\[REDIGIDO\]@cache/);
});

test("REQ-OPS-19: serializarErro traz nome, mensagem e pilha curta, sem segredo", () => {
  const erro = Object.assign(new Error("conexão recusada em redis://:segredo@h:1"), { code: "ECONNREFUSED" });
  const s = serializeError(erro);
  assert.equal(s.nome, "Error");
  assert.equal(s.codigo, "ECONNREFUSED");
  assert.ok(!JSON.stringify(s).includes("segredo"));
  assert.ok(String(s.pilha).split("\n").length <= 6);
  assert.deepEqual(serializeError("texto solto"), { valor: "texto solto" });
});

test("REQ-OPS-19: ERROS.interno responde 500 sem detalhe no corpo e registra a causa no log", async () => {
  const causa = new Error("falha ao falar com redis://:segredo@h:1");
  const registros = capturar("error", () => {
    const res = ERRORS.internal("listar produtos", causa);
    assert.equal(res.status, 500);
  });
  assert.equal(registros.length, 1);
  assert.equal(registros[0].evento, "erro_interno");
  assert.equal(registros[0].contexto, "listar produtos");
  assert.ok(!JSON.stringify(registros[0]).includes("segredo"));
  assert.match(JSON.stringify(registros[0]), /falha ao falar com/);

  const corpo = await ERRORS.internal("listar produtos", causa).json();
  assert.deepEqual(corpo, { erro: "Erro ao listar produtos" });
});

test("REQ-OPS-19: limitarFrequencia deixa passar uma ocorrência por intervalo e por chave", () => {
  const pode = throttle(1000);
  assert.equal(pode("a", 0), true);
  assert.equal(pode("a", 500), false);
  assert.equal(pode("b", 500), true);
  assert.equal(pode("a", 1000), true);
});
