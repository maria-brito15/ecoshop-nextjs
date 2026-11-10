// Capacidade CHAT — docs/capabilities/chat-sustentabilidade/spec.md
import {
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  stubFetch,
  json,
  encerrar,
  limparRateLimit,
} from "./helpers";
import { test, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as chat } from "@/app/api/ia/chat/route";

after(encerrar);

let restaurar: (() => void) | undefined;
beforeEach(() => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
});
afterEach(() => restaurar?.());

const gemini = (texto: string) =>
  json({ candidates: [{ content: { parts: [{ text: texto }] } }] });
async function comoUsuario(nome: string) {
  return cookieDe(await criarUsuarioDireto(email(nome), "CLIENTE"));
}
const enviar = (cookie: string, mensagem: unknown) =>
  chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem } }));

test("REQ-CHAT-01: mensagem válida de usuário autenticado devolve a resposta da IA", async () => {
  restaurar = stubFetch(() => gemini("Leve as pilhas a um ponto de coleta."));
  const res = await enviar(
    await comoUsuario("chat01"),
    "Como descartar pilhas?",
  );
  assert.equal(res.status, 200);
  assert.equal(
    (await res.json()).resposta,
    "Leve as pilhas a um ponto de coleta.",
  );
});

test("REQ-CHAT-02: mais de 20 mensagens por minuto por usuário respondem 429", async () => {
  await limparRateLimit();
  restaurar = stubFetch(() => gemini("ok"));
  const cookie = await comoUsuario("chat02");
  const status: number[] = [];
  for (let i = 0; i < 21; i++) status.push((await enviar(cookie, "oi")).status);
  assert.ok(
    status.slice(0, 20).every((s) => s === 200),
    "as 20 primeiras devem passar",
  );
  assert.equal(status[20], 429);
});

test("REQ-CHAT-03: sem chave configurada o chat responde 503", async () => {
  delete process.env.GEMINI_KEY;
  const res = await enviar(await comoUsuario("chat03"), "oi");
  assert.equal(res.status, 503);
});

test("REQ-CHAT-04: se a IA falha, o chat responde 502", async () => {
  restaurar = stubFetch(() => json({ erro: "falha" }, 500));
  const res = await enviar(await comoUsuario("chat04"), "oi");
  assert.equal(res.status, 502);
});

test("REQ-CHAT-05: mensagem vazia ou acima de 2000 caracteres responde 400", async () => {
  const cookie = await comoUsuario("chat05");
  assert.equal((await enviar(cookie, "")).status, 400);
  assert.equal((await enviar(cookie, "a".repeat(2001))).status, 400);
});

test("REQ-CHAT-07: visitante sem sessão recebe 401", async () => {
  const res = await chat(
    req("/api/ia/chat", { method: "POST", body: { mensagem: "Olá" } }),
  );
  assert.equal(res.status, 401);
});
