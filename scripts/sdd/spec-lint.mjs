#!/usr/bin/env node
// scripts/sdd/spec-lint.mjs — formato das specs de capacidade e de mudança.
// Verifica: seções obrigatórias, IDs únicos e no prefixo da capacidade, requisitos em EARS,
// ADRs citados existentes, spec.md ↔ status.md consistentes, specs/NNN completas.
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  RAIZ,
  ler,
  tabela,
  temSecao,
  capacidades,
  lerAdrs,
  listar,
  STATUS_VALIDOS,
  relatar,
} from "./lib.mjs";

const erros = [];
const adrs = new Set(lerAdrs().map((a) => a.id));
const vistos = new Map();
const SECOES = [
  "Objetivo",
  "Atores",
  "Regras de negócio",
  "Requisitos",
  "Casos-limite",
  "Interfaces",
  "NFRs aplicáveis",
  "Fora de escopo",
  "Perguntas abertas",
];

for (const cap of capacidades()) {
  const onde = `docs/capabilities/${cap.pasta}`;
  if (!existsSync(cap.spec)) {
    erros.push(`${onde}/spec.md não existe`);
    continue;
  }
  if (!existsSync(cap.status)) {
    erros.push(`${onde}/status.md não existe`);
    continue;
  }
  const spec = ler(cap.spec);
  const status = ler(cap.status);
  for (const s of SECOES)
    if (!temSecao(spec, s))
      erros.push(`${onde}/spec.md: falta a seção "## ${s}"`);

  const reqs = tabela(spec, "Requisitos") ?? [];
  const ids = [];
  for (const [id, enunciado] of reqs) {
    if (!new RegExp(`^REQ-${cap.codigo}-\\d{2}$`).test(id)) {
      erros.push(`${onde}: ID "${id}" fora do padrão REQ-${cap.codigo}-NN`);
      continue;
    }
    if (vistos.has(id))
      erros.push(`${id} duplicado (${vistos.get(id)} e ${onde})`);
    vistos.set(id, onde);
    ids.push(id);
    if (!/\bdeve(m)?\b/i.test(enunciado ?? ""))
      erros.push(
        `${id}: o enunciado não está em forma EARS ("... o sistema deve ...")`,
      );
  }
  if (!ids.length) erros.push(`${onde}/spec.md: nenhum requisito encontrado`);

  const linhas = tabela(status, "Status") ?? [];
  const noStatus = new Set();
  for (const [id, st] of linhas) {
    noStatus.add(id);
    if (!ids.includes(id))
      erros.push(`${onde}/status.md: ${id} não existe na spec`);
    if (!STATUS_VALIDOS.includes(st))
      erros.push(`${onde}/status.md: ${id} com status inválido "${st}"`);
  }
  for (const id of ids)
    if (!noStatus.has(id))
      erros.push(`${onde}/status.md: falta linha para ${id}`);

  for (const m of spec.matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      erros.push(`${onde}/spec.md cita ${m[0]}, que não existe`);
}

// specs de mudança (Spec Kit)
for (const spec of listar(
  join(RAIZ, "specs"),
  (p) => basename(p) === "spec.md",
)) {
  const pasta = spec.slice(0, -"/spec.md".length);
  const nome = pasta.slice(pasta.lastIndexOf("/") + 1);
  if (!/^\d{3}-/.test(nome))
    erros.push(`specs/${nome}: o nome deve começar com NNN-`);
  for (const f of ["plan.md", "tasks.md"])
    if (!existsSync(join(pasta, f))) erros.push(`specs/${nome}: falta ${f}`);
  for (const m of ler(spec).matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      erros.push(`specs/${nome}/spec.md cita ${m[0]}, que não existe`);
}

relatar("spec-lint", erros);
