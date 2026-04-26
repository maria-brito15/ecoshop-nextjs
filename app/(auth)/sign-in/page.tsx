"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  LoginBody,
  RegistroBody,
  LoginResponse,
  RegistroResponse,
  ApiErro,
} from "@/types/api";

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
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function alternarModo() {
    setModo((prev) => (prev === "login" ? "cadastro" : "login"));
    setErro(null);
    setForm({ nome: "", email: "", senha: "", telefone: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const url = modo === "login" ? "/api/auth" : "/api/users";

      const body: LoginBody | RegistroBody =
        modo === "login"
          ? { email: form.email, senha: form.senha }
          : {
              nome: form.nome,
              email: form.email,
              senha: form.senha,
              ...(form.telefone ? { telefone: form.telefone } : {}),
            };

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: LoginResponse | RegistroResponse | ApiErro = await res.json();

      if (!res.ok) {
        setErro((data as ApiErro).erro ?? "Erro desconhecido");
        return;
      }

      router.push("/");
    } catch {
      setErro("Falha de conexão com o servidor");
    } finally {
      setCarregando(false);
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
