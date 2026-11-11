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
function capture(method: "log" | "warn" | "error", fn: () => void): Record<string, unknown>[] {
  const spy = mock.method(console, method, () => {});
  try {
    fn();
    return spy.mock.calls.map((c) => JSON.parse(String(c.arguments[0])));
  } finally {
    spy.mock.restore();
  }
}

test("REQ-OPS-19: o log é uma linha JSON com data, nível e evento", () => {
  const [line] = capture("warn", () => log.warn("teste.evento", { rota: "/api/x", ms: 12 }));
  assert.equal(line.nivel, "warn");
  assert.equal(line.evento, "teste.evento");
  assert.equal(line.rota, "/api/x");
  assert.equal(line.ms, 12);
  assert.ok(!Number.isNaN(Date.parse(String(line.ts))));
});

test("REQ-OPS-19: chaves sensíveis do contexto, em qualquer profundidade, viram [REDIGIDO]", () => {
  const [line] = capture("log", () =>
    log.info("teste.sensivel", {
      senha: "abc",
      token: "t",
      JWT_SECRET: "s",
      GEMINI_KEY: "k",
      aninhado: { authorization: "Bearer x", cookie: "token=1", ok: "visível" },
      lista: [{ password: "p" }],
    }),
  );
  assert.equal(line.senha, "[REDIGIDO]");
  assert.equal(line.token, "[REDIGIDO]");
  assert.equal(line.JWT_SECRET, "[REDIGIDO]");
  assert.equal(line.GEMINI_KEY, "[REDIGIDO]");
  assert.deepEqual(line.aninhado, { authorization: "[REDIGIDO]", cookie: "[REDIGIDO]", ok: "visível" });
  assert.deepEqual(line.lista, [{ password: "[REDIGIDO]" }]);
});

test("REQ-OPS-19: credenciais dentro de URLs em textos são mascaradas", () => {
  const [line] = capture("log", () =>
    log.info("teste.url", { destino: "falhou em redis://:minhasenha@cache:6379/0 e postgresql://usr:pw@db:5432/x" }),
  );
  const text = JSON.stringify(line);
  assert.ok(!text.includes("minhasenha"));
  assert.ok(!text.includes("usr:pw"));
  assert.match(String(line.destino), /redis:\/\/\[REDIGIDO\]@cache/);
});

test("REQ-OPS-19: serializarErro traz nome, mensagem e pilha curta, sem segredo", () => {
  const error = Object.assign(new Error("conexão recusada em redis://:segredo@h:1"), { code: "ECONNREFUSED" });
  const s = serializeError(error);
  assert.equal(s.nome, "Error");
  assert.equal(s.codigo, "ECONNREFUSED");
  assert.ok(!JSON.stringify(s).includes("segredo"));
  assert.ok(String(s.pilha).split("\n").length <= 6);
  assert.deepEqual(serializeError("texto solto"), { valor: "texto solto" });
});

test("REQ-OPS-19: ERROS.interno responde 500 sem detalhe no corpo e registra a causa no log", async () => {
  const cause = new Error("falha ao falar com redis://:segredo@h:1");
  const records = capture("error", () => {
    const res = ERRORS.internal("listar produtos", cause);
    assert.equal(res.status, 500);
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].evento, "erro_interno");
  assert.equal(records[0].contexto, "listar produtos");
  assert.ok(!JSON.stringify(records[0]).includes("segredo"));
  assert.match(JSON.stringify(records[0]), /falha ao falar com/);

  const body = await ERRORS.internal("listar produtos", cause).json();
  assert.deepEqual(body, { erro: "Erro ao listar produtos" });
});

test("REQ-OPS-19: limitarFrequencia deixa passar uma ocorrência por intervalo e por chave", () => {
  const can = throttle(1000);
  assert.equal(can("a", 0), true);
  assert.equal(can("a", 500), false);
  assert.equal(can("b", 500), true);
  assert.equal(can("a", 1000), true);
});
