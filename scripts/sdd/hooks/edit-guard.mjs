#!/usr/bin/env node
// PreToolUse (Edit|Write): pede confirmação ao editar a Constitution, ADR aceito ou o baseline congelado.
import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import { entrada, pedirConfirmacao } from "./lib.mjs";

const ev = await entrada();
const alvo = ev.tool_input?.file_path;
if (!alvo) process.exit(0);
const rel = relative(process.cwd(), alvo).replaceAll("\\", "/");

if (rel === ".specify/memory/constitution.md")
  pedirConfirmacao(
    "A Constitution só muda por emenda aprovada pelo dono. Confirme que isso foi pedido.",
  );
else if (rel.startsWith("docs/discovery/"))
  pedirConfirmacao(
    "docs/discovery é retrato congelado. Confirme que a edição é intencional.",
  );
else if (
  /^docs\/architecture\/adr\/\d{4}-.*\.md$/.test(rel) &&
  existsSync(alvo) &&
  /^[-*\s]*\**Status:?\**:?\s*Aceito/im.test(readFileSync(alvo, "utf8"))
)
  pedirConfirmacao(
    "ADR Aceito não se edita; crie um ADR que o substitua. Confirme que é só correção de forma.",
  );
