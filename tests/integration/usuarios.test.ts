// Capacidade USR — docs/capabilities/gestao-de-usuarios/spec.md
import { email, criarUsuarioDireto, cookieDe, req, encerrar } from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { GET as listar, POST as criar } from "@/app/api/usuarios/route";

after(encerrar);

test("REQ-USR-01: a listagem de usuários por admin não expõe a senha", async () => {
  const cookie = await cookieDe(
    await criarUsuarioDireto(email("usr01-admin"), "ADMIN"),
  );
  const res = await listar(req("/api/usuarios?page=1&size=5", { cookie }));
  assert.equal(res.status, 200);
  const corpo = JSON.stringify(await res.json());
  assert.equal(
    corpo.includes('"senha"'),
    false,
    "a lista não pode conter o campo senha",
  );
});

test("REQ-USR-02: criar usuário por admin guarda hash bcrypt e responde 201", async () => {
  const cookie = await cookieDe(
    await criarUsuarioDireto(email("usr02-admin"), "ADMIN"),
  );
  const novo = email("usr02-novo");
  const res = await criar(
    req("/api/usuarios", {
      method: "POST",
      cookie,
      body: { nome: "Usuario Novo", email: novo, senha: "Senha12345" },
    }),
  );
  assert.equal(res.status, 201);
  const salvo = await prisma.usuario.findUnique({ where: { email: novo } });
  assert.ok(salvo?.senha.startsWith("$2"), "a senha deve estar em hash bcrypt");
  assert.notEqual(salvo?.senha, "Senha12345");
});
