"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useRegistro } from "@/lib/hooks/useAuth";
import type { LoginBody, RegistroBody } from "@/types/api";

type Modo = "login" | "cadastro";

type Form = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
};

export default function AuthPage() {
  const router = useRouter();

  const [modo, setModo] = useState<Modo>("login");
  const [form, setForm] = useState<Form>({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const login = useLogin();
  const registro = useRegistro();

  const hook = modo === "login" ? login : registro;
  const erro = hook.erro;
  const carregando = hook.carregando;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function alternarModo() {
    setModo((prev) => (prev === "login" ? "cadastro" : "login"));
    setForm({ nome: "", email: "", senha: "", telefone: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (modo === "login") {
      const body: LoginBody = { email: form.email, senha: form.senha };
      const data = await login.executar("/api/auth", body);
      if (data) router.push("/");
    } else {
      const body: RegistroBody = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        ...(form.telefone ? { telefone: form.telefone } : {}),
      };
      const data = await registro.executar("/api/users", body);
      if (data) router.push("/");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{modo === "login" ? "Login" : "Cadastro"}</h1>

      {modo === "cadastro" && (
        <div>
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
        />
      </div>

      {modo === "cadastro" && (
        <div>
          <label htmlFor="telefone">Telefone (opcional)</label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            value={form.telefone}
            onChange={handleChange}
          />
        </div>
      )}

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <button type="submit" disabled={carregando}>
        {carregando
          ? "Aguarde..."
          : modo === "login"
            ? "Entrar"
            : "Criar conta"}
      </button>

      <button type="button" onClick={alternarModo}>
        {modo === "login"
          ? "Não tem conta? Cadastre-se"
          : "Já tem conta? Faça login"}
      </button>
    </form>
  );
}
