#!/usr/bin/env node
// scripts/sdd/trace-check.mjs — rastreabilidade REQ ↔ teste ↔ status.
// Regras (Constitution, Art. II e XVI):
//  1. todo REQ citado em teste existe numa spec;
//  2. REQ ✅ precisa de teste que roda (não todo/skip) ou de evidência "manual: AAAA-MM-DD …";
//  3. REQ ❌ não pode ter teste ativo passando por inteiro (status desatualizado);
//  4. tarefas de specs/NNN citam REQ existentes.
// Opções: --write  reescreve docs/capabilities/README.md ; --stale  lista pendências antigas (aviso).
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import {
  RAIZ,
  CAP_DIR,
  ler,
  tabela,
  capacidades,
  listar,
  relatar,
  REQ_RE,
} from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const erros = [];
const avisos = [];

// 1. testes
const testes = new Map(); // REQ -> { ativos: n, todo: n, arquivos: Set }
for (const arq of listar(join(RAIZ, "tests"), (p) => p.endsWith(".test.ts"))) {
  const linhas = ler(arq).split("\n");
  linhas.forEach((l, i) => {
    if (!/^\s*test\(/.test(l)) return;
    const ids = l.match(REQ_RE) ?? [];
    // o modificador pode estar na mesma linha ou na seguinte (títulos longos)
    const janela = linhas.slice(i, i + 2).join(" ");
    const inativo = /\{\s*(todo|skip)\b/.test(janela);
    for (const id of ids) {
      const t = testes.get(id) ?? {
        ativos: 0,
        inativos: 0,
        arquivos: new Set(),
      };
      inativo ? t.inativos++ : t.ativos++;
      t.arquivos.add(arq.replace(RAIZ + "/", ""));
      testes.set(id, t);
    }
  });
}

// 2. specs e status
const resumo = [];
const todos = new Map(); // REQ -> { status, evidencia, cap }
for (const cap of capacidades()) {
  const reqs = (tabela(ler(cap.spec), "Requisitos") ?? []).map((r) => r[0]);
  const cont = { "✅": 0, "◐": 0, "❌": 0, "❔": 0 };
  for (const [id, st, evidencia = ""] of tabela(ler(cap.status), "Status") ??
    []) {
    if (!reqs.includes(id)) continue;
    cont[st] = (cont[st] ?? 0) + 1;
    todos.set(id, { status: st, evidencia, cap: cap.codigo });
    const t = testes.get(id);
    if (st === "✅") {
      const manual = /^manual:\s*\d{4}-\d{2}-\d{2}/.test(evidencia);
      if (!t?.ativos && !manual)
        erros.push(
          `${id} está ✅ mas não tem teste ativo (nem evidência "manual: AAAA-MM-DD …")`,
        );
    }
    if (st === "❌" && t?.ativos)
      erros.push(
        `${id} está ❌ mas tem teste ativo: atualize o status (✅ ou ◐)`,
      );
    if (st === "◐" && !evidencia) avisos.push(`${id} ◐ sem evidência`);
    if (st === "❔") avisos.push(`${id} ❔ aguarda verificação`);
  }
  resumo.push({ cap, cont, total: reqs.length });
}

for (const id of testes.keys())
  if (!todos.has(id))
    erros.push(`teste cita ${id}, que não existe em nenhuma spec`);

// 4. tarefas de specs/NNN
for (const f of listar(join(RAIZ, "specs"), (p) => p.endsWith("/tasks.md"))) {
  const proprios = new Set(
    ler(f.replace("tasks.md", "spec.md")).match(REQ_RE) ?? [],
  );
  for (const l of ler(f)
    .split("\n")
    .filter((x) => /^\|\s*T\d+/.test(x))) {
    const ids = l.match(REQ_RE) ?? [];
    const dono = f.replace(RAIZ + "/", "");
    if (!ids.length && !/consolidar/i.test(l))
      erros.push(`${dono}: tarefa sem REQ: ${l.slice(0, 60)}`);
    for (const id of ids)
      if (!todos.has(id) && !proprios.has(id))
        erros.push(`${dono}: ${id} não existe`);
  }
}

if (args.has("--write")) {
  const linhas = [
    "# Capacidades",
    "",
    "> Gerado por `node scripts/sdd/trace-check.mjs --write`. Não edite à mão.",
    "",
    "| Capacidade | Spec | ✅ | ◐ | ❌ | ❔ | Total |",
    "|---|---|---|---|---|---|---|",
    ...resumo.map(
      ({ cap, cont, total }) =>
        `| ${cap.codigo} | [${cap.pasta}](${cap.pasta}/spec.md) | ${cont["✅"]} | ${cont["◐"]} | ${cont["❌"]} | ${cont["❔"]} | ${total} |`,
    ),
    `| **Total** | | ${resumo.reduce((s, r) => s + r.cont["✅"], 0)} | ${resumo.reduce((s, r) => s + r.cont["◐"], 0)} | ${resumo.reduce((s, r) => s + r.cont["❌"], 0)} | ${resumo.reduce((s, r) => s + r.cont["❔"], 0)} | ${resumo.reduce((s, r) => s + r.total, 0)} |`,
    "",
    "Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não cumpre a spec · ❔ não verificado.",
    "",
  ];
  writeFileSync(join(CAP_DIR, "README.md"), linhas.join("\n"));
}

if (args.has("--stale"))
  for (const [id, v] of todos)
    if (v.status === "❔") avisos.push(`pendente de verificação: ${id}`);

console.log(
  `  ${todos.size} requisitos · ${[...todos.values()].filter((v) => v.status === "✅").length} ✅ · ${testes.size} com teste`,
);
relatar(
  "trace-check",
  erros,
  args.has("--quiet")
    ? []
    : avisos.filter(
        (a) => !a.endsWith("aguarda verificação") || args.has("--stale"),
      ),
);
