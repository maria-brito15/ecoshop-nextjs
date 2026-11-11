// scripts/ops/checar-boot.mjs
//
// Verifica REQ-OPS-06 contra o servidor REAL construído (`npm run build` antes):
// em produção, o servidor standalone precisa recusar iniciar com JWT_SECRET
// inválido e iniciar com um válido. O teste de unidade cobre a regra; este script
// cobre o que só o Next faz: abortar o início quando `register()` lança.
//
// Uso: node scripts/ops/checar-boot.mjs

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ_STANDALONE = ".next/standalone";

/**
 * No CI e no Docker o servidor fica em `.next/standalone/server.js`. Se existir
 * outro lockfile acima do projeto (comum em máquinas de desenvolvimento), o Next
 * aninha o standalone em subpastas; por isso, se não estiver na raiz, procura-o.
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
    // o caso "válido" precisa de uma DATABASE_URL de forma válida (o servidor não conecta ao iniciar)
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
