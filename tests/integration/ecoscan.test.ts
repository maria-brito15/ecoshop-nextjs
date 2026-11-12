// Capacidade SCAN — docs/capabilities/ecoscan/spec.md
import {
  email,
  createUserDirectly,
  cookieFor,
  req,
  stubFetch,
  json,
  closeConnections,
} from "./helpers";
import { test, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as scan } from "@/app/api/ai/scan/route";

after(closeConnections);

let restore: (() => void) | undefined;
beforeEach(() => {
  process.env.GEMINI_KEY = "gemini-test-key-123";
});
afterEach(() => restore?.());

const FIELDS = [
  "environmental_impact",
  "decomposition_time",
  "disposal_instructions",
  "recyclability",
  "sustainable_tips",
  "recycling_benefits",
];
const geminiAnalysis = () =>
  json({
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify(
                Object.fromEntries(FIELDS.map((c) => [c, `text of ${c}`])),
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
const isAzure = (url: string) => url.startsWith("https://azure.test");

async function submit(file: File | null) {
  const u = await createUserDirectly(email("scan"), "CUSTOMER");
  const form = new FormData();
  if (file) form.set("image", file);
  return scan(
    req("/api/ai/scan", { method: "POST", cookie: await cookieFor(u), form }),
  );
}
const png = () =>
  new File([new Uint8Array([137, 80, 78, 71])], "photo.png", {
    type: "image/png",
  });

test("REQ-SCAN-01: a material identified with enough confidence returns the 6-field analysis", async () => {
  restore = stubFetch((url) =>
    isAzure(url) ? azure("plastico", 0.93) : geminiAnalysis(),
  );
  const res = await submit(png());
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.success, true);
  assert.equal(c.material, "plastico");
  assert.equal(c.confidence, 93);
  for (const field of FIELDS)
    assert.ok(c.sustainability_analysis[field], field);
});

test("REQ-SCAN-02: confidence below the threshold returns 422 without calling Gemini", async () => {
  let calledGemini = false;
  restore = stubFetch((url) => {
    if (!isAzure(url)) calledGemini = true;
    return json({ predictions: [{ tagName: "vidro", probability: 0.4 }] });
  });
  const res = await submit(png());
  assert.equal(res.status, 422);
  const c = await res.json();
  assert.equal(c.success, false);
  assert.equal(c.confidence, 40);
  assert.equal(calledGemini, false);
});

test("REQ-SCAN-03: the 'outros' tag is never treated as an identification, even with high confidence", async () => {
  restore = stubFetch(() => azure("outros", 0.99));
  assert.equal((await submit(png())).status, 422);
});

test("REQ-SCAN-04: if Gemini returns invalid content, the fallback analysis is used (200)", async () => {
  restore = stubFetch((url) =>
    isAzure(url)
      ? azure("papel", 0.9)
      : json({
          candidates: [{ content: { parts: [{ text: "this is not JSON" }] } }],
        }),
  );
  const res = await submit(png());
  assert.equal(res.status, 200);
  const c = await res.json();
  assert.equal(c.success, true);
  assert.match(c.sustainability_analysis.environmental_impact, /papel/);
});

test("REQ-SCAN-05: if the Gemini network fails, the fallback analysis is used (200)", async () => {
  restore = stubFetch((url) => {
    if (isAzure(url)) return azure("metal", 0.9);
    throw new TypeError("fetch failed");
  });
  assert.equal((await submit(png())).status, 200);
});

test("REQ-SCAN-06: missing file, invalid format or above 10 MB returns 400", async () => {
  restore = stubFetch(() => azure("papel", 0.9));
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

test("REQ-SCAN-07: if Azure does not respond, the answer is 422 with a suggestion (not 500)", async () => {
  restore = stubFetch(() => json({}, 500));
  const res = await submit(png());
  assert.equal(res.status, 422);
  assert.equal((await res.json()).success, false);
});
