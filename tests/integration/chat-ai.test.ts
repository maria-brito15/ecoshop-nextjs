// CHAT capability — docs/capabilities/sustainability-chat/spec.md
import {
  email,
  createUserDirectly,
  cookieDe,
  req,
  stubFetch,
  json,
  closeConnections,
  clearRateLimit,
} from "./helpers";
import { test, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as chat } from "@/app/api/ia/chat/route";

after(closeConnections);

let restore: (() => void) | undefined;
beforeEach(() => {
  process.env.GEMINI_KEY = "chave-gemini-de-teste-123";
});
afterEach(() => restore?.());

const gemini = (text: string) =>
  json({ candidates: [{ content: { parts: [{ text: text }] } }] });
async function asUser(name: string) {
  return cookieDe(await createUserDirectly(email(name), "CLIENTE"));
}
const submit = (cookie: string, message: unknown) =>
  chat(req("/api/ia/chat", { method: "POST", cookie, body: { mensagem: message } }));

test("REQ-CHAT-01: a valid message from an authenticated user returns the AI response", async () => {
  restore = stubFetch(() => gemini("Take batteries to a collection point."));
  const res = await submit(
    await asUser("chat01"),
    "Como descartar pilhas?",
  );
  assert.equal(res.status, 200);
  assert.equal(
    (await res.json()).resposta,
    "Take batteries to a collection point.",
  );
});

test("REQ-CHAT-02: more than 20 messages per minute per user return 429", async () => {
  await clearRateLimit();
  restore = stubFetch(() => gemini("ok"));
  const cookie = await asUser("chat02");
  const status: number[] = [];
  for (let i = 0; i < 21; i++) status.push((await submit(cookie, "oi")).status);
  assert.ok(
    status.slice(0, 20).every((s) => s === 200),
    "the first 20 must pass",
  );
  assert.equal(status[20], 429);
});

test("REQ-CHAT-03: without a configured key the chat returns 503", async () => {
  delete process.env.GEMINI_KEY;
  const res = await submit(await asUser("chat03"), "oi");
  assert.equal(res.status, 503);
});

test("REQ-CHAT-04: if the AI fails, the chat returns 502", async () => {
  restore = stubFetch(() => json({ erro: "failure" }, 500));
  const res = await submit(await asUser("chat04"), "oi");
  assert.equal(res.status, 502);
});

test("REQ-CHAT-05: empty message or above 2000 characters returns 400", async () => {
  const cookie = await asUser("chat05");
  assert.equal((await submit(cookie, "")).status, 400);
  assert.equal((await submit(cookie, "a".repeat(2001))).status, 400);
});

test("REQ-CHAT-07: a visitor without a session gets 401", async () => {
  const res = await chat(
    req("/api/ia/chat", { method: "POST", body: { mensagem: "Hello" } }),
  );
  assert.equal(res.status, 401);
});
