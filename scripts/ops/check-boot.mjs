// scripts/ops/check-boot.mjs
//
// Verifies REQ-OPS-06 against the REAL built server (`npm run build` first):
// in production, the standalone server must refuse to start with an invalid JWT_SECRET
// and start with a valid one. The unit test covers the rule; this script
// covers what only Next does: aborting startup when `register()` throws.
//
// Usage: node scripts/ops/check-boot.mjs

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const STANDALONE_ROOT = ".next/standalone";

/**
 * In CI and Docker the server lives at `.next/standalone/server.js`. If another
 * lockfile exists above the project (common on development machines), Next
 * nests the standalone output in subfolders; so, if it is not at the root, look for it.
 */
function findServer(folder = STANDALONE_ROOT) {
  if (!existsSync(folder)) return null;
  if (existsSync(join(folder, "server.js"))) return join(folder, "server.js");
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const found = findServer(join(folder, entry.name));
    if (found) return found;
  }
  return null;
}

const SERVER = findServer();
const REFUSAL_LIMIT_MS = 30_000;
const STARTUP_WAIT_MS = 8_000;

const VALID_SECRET = "x7Qm2LbR9vTn4KcE8wYpZa3JdHfUg6Nz";
const INVALID_SECRETS = [
  ["missing", undefined],
  ["short", "short"],
  ["example-value", "supersecretkeychangeinproduction"],
];

function start(jwtSecret) {
  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3987",
    // the "valid" case needs a well-formed DATABASE_URL (the server does not connect on startup)
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://user:password@127.0.0.1:1/database",
    HOSTNAME: "127.0.0.1",
  };
  if (jwtSecret === undefined) delete env.JWT_SECRET;
  else env.JWT_SECRET = jwtSecret;

  const child = spawn(process.execPath, [SERVER], { env });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const exited = new Promise((resolve) =>
    child.on("exit", (code) => resolve(code)),
  );
  return { child, exited, output: () => output };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!SERVER) {
    console.error(
      `❌ standalone server not found in ${STANDALONE_ROOT}. Run "npm run build" first.`,
    );
    process.exit(2);
  }

  let failures = 0;

  for (const [label, value] of INVALID_SECRETS) {
    const { child, exited, output } = start(value);
    const result = await Promise.race([
      exited,
      wait(REFUSAL_LIMIT_MS).then(() => "TIMEOUT"),
    ]);
    if (result === "TIMEOUT") {
      child.kill();
      console.error(`❌ ${label} secret: the server did NOT refuse to start`);
      failures++;
    } else if (result === 0 || !/JWT_SECRET/.test(output())) {
      console.error(
        `❌ ${label} secret: exited with code ${result} without the expected message`,
      );
      failures++;
    } else {
      console.log(`✔ ${label} secret: server refused to start (code ${result})`);
    }
  }

  const valid = start(VALID_SECRET);
  const result = await Promise.race([
    valid.exited,
    wait(STARTUP_WAIT_MS).then(() => "ALIVE"),
  ]);
  if (result === "ALIVE") {
    valid.child.kill();
    console.log("✔ valid secret: server started");
  } else {
    console.error(
      `❌ valid secret: the server exited (code ${result})\n${valid.output()}`,
    );
    failures++;
  }

  process.exit(failures === 0 ? 0 : 1);
}

main();
