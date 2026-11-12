// scripts/ops/check-boot.mjs
//
// Verifies REQ-OPS-06 against the REAL built server (`npm run build` first):
// in production, the standalone server must refuse to start with an invalid JWT_SECRET
// and start with a valid one. The unit test covers the rule; this script
// covers what only Next does: aborting startup when `register()` throws.
//
// Uso: node scripts/ops/check-boot.mjs

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ_STANDALONE = ".next/standalone";

/**
 * In CI and Docker the server lives at `.next/standalone/server.js`. If another
 * lockfile exists above the project (common on development machines), Next
 * nests the standalone output in subfolders; so, if it is not at the root, look for it.
 */
function localizarServidor(pasta = RAIZ_STANDALONE) {
  if (!existsSync(pasta)) return null;
  if (existsSync(join(pasta, "server.js"))) return join(pasta, "server.js");
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    if (!entrada.isDirectory() || entrada.name === "node_modules") continue;
    const achado = localizarServidor(join(pasta, entrada.name));
    if (achado) return achado;
  }
  return null;
}

const SERVIDOR = localizarServidor();
const LIMITE_RECUSA_MS = 30_000;
const ESPERA_INICIO_MS = 8_000;

const SEGREDO_VALIDO = "x7Qm2LbR9vTn4KcE8wYpZa3JdHfUg6Nz";
const SEGREDOS_INVALIDOS = [
  ["ausente", undefined],
  ["curto", "curto"],
  ["valor-exemplo", "supersecretkeychangeinproduction"],
];

function iniciar(jwtSecret) {
  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3987",
    // the "valid" case needs a well-formed DATABASE_URL (the server does not connect on startup)
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://usuario:senha@127.0.0.1:1/banco",
    HOSTNAME: "127.0.0.1",
  };
  if (jwtSecret === undefined) delete env.JWT_SECRET;
  else env.JWT_SECRET = jwtSecret;

  const filho = spawn(process.execPath, [SERVIDOR], { env });
  let saida = "";
  filho.stdout.on("data", (d) => (saida += d));
  filho.stderr.on("data", (d) => (saida += d));
  const encerrou = new Promise((resolve) =>
    filho.on("exit", (codigo) => resolve(codigo)),
  );
  return { filho, encerrou, saida: () => saida };
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!SERVIDOR) {
    console.error(
      `❌ servidor standalone não encontrado em ${RAIZ_STANDALONE}. Rode "npm run build" antes.`,
    );
    process.exit(2);
  }

  let falhas = 0;

  for (const [rotulo, valor] of SEGREDOS_INVALIDOS) {
    const { filho, encerrou, saida } = iniciar(valor);
    const resultado = await Promise.race([
      encerrou,
      esperar(LIMITE_RECUSA_MS).then(() => "TEMPO"),
    ]);
    if (resultado === "TEMPO") {
      filho.kill();
      console.error(`❌ segredo ${rotulo}: o servidor NÃO recusou iniciar`);
      falhas++;
    } else if (resultado === 0 || !/JWT_SECRET/.test(saida())) {
      console.error(
        `❌ segredo ${rotulo}: saiu com código ${resultado} sem a mensagem esperada`,
      );
      falhas++;
    } else {
      console.log(`✔ segredo ${rotulo}: servidor recusou iniciar (código ${resultado})`);
    }
  }

  const valido = iniciar(SEGREDO_VALIDO);
  const resultado = await Promise.race([
    valido.encerrou,
    esperar(ESPERA_INICIO_MS).then(() => "VIVO"),
  ]);
  if (resultado === "VIVO") {
    valido.filho.kill();
    console.log("✔ segredo válido: servidor iniciou");
  } else {
    console.error(
      `❌ segredo válido: o servidor encerrou (código ${resultado})\n${valido.saida()}`,
    );
    falhas++;
  }

  process.exit(falhas === 0 ? 0 : 1);
}

main();
