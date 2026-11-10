// Capacidade OPS — docs/capabilities/operacao/spec.md
import { encerrar, req } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { GET as health } from "@/app/api/health/route";

after(encerrar);

test("REQ-OPS-01: /api/health responde 200 e indica banco e Redis quando ambos estão disponíveis", async () => {
  void req;
  const res = await health();
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.ok, true);
  assert.deepEqual(c.services, { database: true, redis: true });
});
