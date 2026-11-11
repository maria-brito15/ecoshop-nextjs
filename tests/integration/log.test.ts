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

test("REQ-OPS-19: the log is a JSON line with date, level and event", () => {
  const [line] = capture("warn", () => log.warn("test.event", { route: "/api/x", ms: 12 }));
  assert.equal(line.level, "warn");
  assert.equal(line.event, "test.event");
  assert.equal(line.route, "/api/x");
  assert.equal(line.ms, 12);
  assert.ok(!Number.isNaN(Date.parse(String(line.ts))));
});

test("REQ-OPS-19: sensitive context keys, at any depth, become [REDACTED]", () => {
  const [line] = capture("log", () =>
    log.info("test.sensitive", {
      senha: "abc",
      token: "t",
      JWT_SECRET: "s",
      GEMINI_KEY: "k",
      aninhado: { authorization: "Bearer x", cookie: "token=1", ok: "visible" },
      lista: [{ password: "p" }],
    }),
  );
  assert.equal(line.senha, "[REDACTED]");
  assert.equal(line.token, "[REDACTED]");
  assert.equal(line.JWT_SECRET, "[REDACTED]");
  assert.equal(line.GEMINI_KEY, "[REDACTED]");
  assert.deepEqual(line.aninhado, { authorization: "[REDACTED]", cookie: "[REDACTED]", ok: "visible" });
  assert.deepEqual(line.lista, [{ password: "[REDACTED]" }]);
});

test("REQ-OPS-19: credentials inside URLs in texts are masked", () => {
  const [line] = capture("log", () =>
    log.info("test.url", { destination: "failed at redis://:mypassword@cache:6379/0 and postgresql://usr:pw@db:5432/x" }),
  );
  const text = JSON.stringify(line);
  assert.ok(!text.includes("minhasenha"));
  assert.ok(!text.includes("usr:pw"));
  assert.match(String(line.destination), /redis:\/\/\[REDACTED\]@cache/);
});

test("REQ-OPS-19: serializeError returns name, message and a short stack, without secrets", () => {
  const error = Object.assign(new Error("connection refused at redis://:secret@h:1"), { code: "ECONNREFUSED" });
  const s = serializeError(error);
  assert.equal(s.name, "Error");
  assert.equal(s.code, "ECONNREFUSED");
  assert.ok(!JSON.stringify(s).includes("secret"));
  assert.ok(String(s.stack).split("\n").length <= 6);
  assert.deepEqual(serializeError("loose text"), { value: "loose text" });
});

test("REQ-OPS-19: ERRORS.internal returns 500 with no detail in the body and logs the cause", async () => {
  const cause = new Error("failure talking to redis://:secret@h:1");
  const records = capture("error", () => {
    const res = ERRORS.internal("list products", cause);
    assert.equal(res.status, 500);
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].event, "internal_error");
  assert.equal(records[0].context, "list products");
  assert.ok(!JSON.stringify(records[0]).includes("secret"));
  assert.match(JSON.stringify(records[0]), /failure talking to/);

  const body = await ERRORS.internal("list products", cause).json();
  assert.deepEqual(body, { erro: "Failed to list products" });
});

test("REQ-OPS-19: throttle lets one occurrence through per interval and per key", () => {
  const can = throttle(1000);
  assert.equal(can("a", 0), true);
  assert.equal(can("a", 500), false);
  assert.equal(can("b", 500), true);
  assert.equal(can("a", 1000), true);
});
