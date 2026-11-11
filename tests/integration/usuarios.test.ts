// Capacidade USR — docs/capabilities/gestao-de-usuarios/spec.md
import {
  email,
  criarUsuarioDireto,
  cookieDe,
  req,
  ctx,
  encerrar,
} from "./helpers";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { GET as listar, POST as criar } from "@/app/api/usuarios/route";
import { GET as listarMarcas } from "@/app/api/marcas/route";
import { POST as aprovarMarca } from "@/app/api/marcas/[id]/aprovar/route";

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

async function marcaPendente(nomeBase: string) {
  const mail = email(nomeBase);
  await prisma.usuario.deleteMany({ where: { email: mail } });
  const usuario = await prisma.usuario.create({
    data: { nome: "Marca Pendente", email: mail, senha: "hash", tipo: "CLIENTE" },
  });
  const marca = await prisma.marca.create({
    data: {
      nome: `Marca Pendente ${mail}`,
      usuarioId: usuario.id,
      status: "PENDENTE",
    },
  });
  return { usuario, marca };
}

test("REQ-USR-03: ADMIN aprova marca pendente e o usuário associado passa a MARCA", async () => {
  const cookie = await cookieDe(
    await criarUsuarioDireto(email("usr03-admin"), "ADMIN"),
  );
  const { usuario, marca } = await marcaPendente("usr03");

  const res = await aprovarMarca(
    req(`/api/marcas/${marca.id}/aprovar`, { method: "POST", cookie }),
    ctx(marca.id),
  );
  assert.equal(res.status, 200);
  const corpo = await res.json();
  assert.equal(corpo.marca.status, "APROVADA");

  const usuarioAtualizado = await prisma.usuario.findUnique({
    where: { id: usuario.id },
  });
  assert.equal(usuarioAtualizado?.tipo, "MARCA");
});

test("REQ-USR-03: aprovar uma marca que já não está pendente responde 409", async () => {
  const cookie = await cookieDe(
    await criarUsuarioDireto(email("usr03b-admin"), "ADMIN"),
  );
  const { marca } = await marcaPendente("usr03b");

  await aprovarMarca(
    req(`/api/marcas/${marca.id}/aprovar`, { method: "POST", cookie }),
    ctx(marca.id),
  );
  const segunda = await aprovarMarca(
    req(`/api/marcas/${marca.id}/aprovar`, { method: "POST", cookie }),
    ctx(marca.id),
  );
  assert.equal(segunda.status, 409);
});

test("REQ-USR-05: a listagem de marcas inclui o status de cada uma", async () => {
  await marcaPendente("usr05");
  const res = await listarMarcas();
  assert.equal(res.status, 200);
  const corpo = await res.json();
  assert.ok(corpo.marcas.length > 0);
  assert.ok(
    corpo.marcas.every((m: { status: string }) => typeof m.status === "string"),
  );
});
