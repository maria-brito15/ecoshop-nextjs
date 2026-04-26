// app/(perfil)/perfil/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: string;
  criadoEm: string;
};

type EditForm = {
  nome: string;
  telefone: string;
};

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<EditForm>({ nome: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const authRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!authRes.ok) {
          router.push("/sign-in");
          return;
        }
        const authData = await authRes.json();
        const id = authData.usuario.id;

        const res = await fetch(`/api/usuarios/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Erro ao buscar perfil");
        const data = await res.json();
        setUsuario(data.usuario);
        setForm({
          nome: data.usuario.nome,
          telefone: data.usuario.telefone ?? "",
        });
      } catch {
        setErro("Não foi possível carregar o perfil.");
      } finally {
        setCarregando(false);
      }
    }

    fetchPerfil();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
    router.push("/sign-in");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    setSalvando(true);
    setErroEdit(null);

    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          ...(form.telefone ? { telefone: form.telefone } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErroEdit(data.mensagem ?? "Erro ao salvar alterações.");
        return;
      }

      const data = await res.json();
      setUsuario((prev) => (prev ? { ...prev, ...data.usuario } : prev));
      setEditando(false);
    } catch {
      setErroEdit("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function handleCancelar() {
    if (!usuario) return;
    setForm({ nome: usuario.nome, telefone: usuario.telefone ?? "" });
    setErroEdit(null);
    setEditando(false);
  }

  if (carregando) return <p>Carregando perfil...</p>;
  if (erro || !usuario) return <p>{erro ?? "Perfil não encontrado."}</p>;

  return (
    <main>
      <h1>Meu perfil</h1>

      {!editando ? (
        <>
          <p>
            <strong>Nome:</strong> {usuario.nome}
          </p>
          <p>
            <strong>Email:</strong> {usuario.email}
          </p>
          <p>
            <strong>Telefone:</strong> {usuario.telefone ?? "Não informado"}
          </p>
          <p>
            <strong>Membro desde:</strong>{" "}
            {new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}
          </p>

          <button onClick={() => setEditando(true)}>Editar perfil</button>
          <button onClick={handleLogout}>Sair da conta</button>
        </>
      ) : (
        <form onSubmit={handleSalvar}>
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

          {erroEdit && <p style={{ color: "red" }}>{erroEdit}</p>}

          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={handleCancelar} disabled={salvando}>
            Cancelar
          </button>
        </form>
      )}
    </main>
  );
}
