// app/(admin)/painel/page.tsx

"use client";

import { useState } from "react";

import {
  useListarProdutos,
  useCriarProduto,
  useAtualizarProduto,
  useDeletarProduto,
} from "@/lib/hooks/useProdutos";
import {
  useListarCategorias,
  useCriarCategoria,
  useAtualizarCategoria,
  useDeletarCategoria,
} from "@/lib/hooks/useCategorias";
import {
  useListarMarcas,
  useCriarMarca,
  useAtualizarMarca,
  useDeletarMarca,
} from "@/lib/hooks/useMarcas";
import {
  useListarCertificados,
  useCriarCertificado,
  useAtualizarCertificado,
  useDeletarCertificado,
} from "@/lib/hooks/useCertificados";

import type { Produto, Categoria, Marca, Certificado } from "@/types/api";

type Aba = "produtos" | "categorias" | "marcas" | "certificados";

export default function PainelPage() {
  const [aba, setAba] = useState<Aba>("produtos");

  return (
    <main>
      <h1>Painel Admin</h1>

      <nav>
        {(["produtos", "categorias", "marcas", "certificados"] as Aba[]).map(
          (a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              style={{ fontWeight: aba === a ? "bold" : "normal" }}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ),
        )}
      </nav>

      <hr />

      {aba === "produtos" && <SecaoProdutos />}
      {aba === "categorias" && <SecaoCategorias />}
      {aba === "marcas" && <SecaoMarcas />}
      {aba === "certificados" && <SecaoCertificados />}
    </main>
  );
}

function SecaoProdutos() {
  const { data, carregando, erro } = useListarProdutos();
  const criar = useCriarProduto();
  const atualizar = useAtualizarProduto();
  const deletar = useDeletarProduto();

  const { data: dataCategorias } = useListarCategorias();
  const { data: dataMarcas } = useListarMarcas();

  const produtos = data?.produtos ?? [];
  const categorias = dataCategorias?.categorias ?? [];
  const marcas = dataMarcas?.marcas ?? [];

  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoriaId: "",
    marcaId: "",
  });

  function abrirCriar() {
    setEditando(null);
    setForm({
      nome: "",
      descricao: "",
      preco: "",
      categoriaId: "",
      marcaId: "",
    });
  }

  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      preco: p.preco,
      categoriaId: String(p.categoriaId),
      marcaId: String(p.marcaId),
    });
  }

  function fechar() {
    setEditando(null);
    setForm({
      nome: "",
      descricao: "",
      preco: "",
      categoriaId: "",
      marcaId: "",
    });
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      preco: parseFloat(form.preco),
      categoriaId: Number(form.categoriaId),
      marcaId: Number(form.marcaId),
    };

    if (editando) {
      const ok = await atualizar.executar(`/api/produtos/${editando.id}`, body);
      if (ok) fechar();
    } else {
      const ok = await criar.executar("/api/produtos", body);
      if (ok) fechar();
    }
  }

  async function handleDeletar(id: number) {
    if (!confirm("Deletar produto?")) return;
    await deletar.executar(`/api/produtos/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section>
      <h2>Produtos</h2>
      <button onClick={abrirCriar}>+ Novo Produto</button>

      {(editando !== null || form.nome !== "" || form.preco !== "") && (
        <form onSubmit={handleSubmit}>
          <h3>{editando ? "Editar Produto" : "Novo Produto"}</h3>

          <div>
            <label>Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Preço</label>
            <input
              name="preco"
              type="number"
              step="0.01"
              value={form.preco}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Categoria</label>
            <select
              name="categoriaId"
              value={form.categoriaId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Marca</label>
            <select
              name="marcaId"
              value={form.marcaId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {erroMutacao && <p style={{ color: "red" }}>{erroMutacao}</p>}

          <button type="submit" disabled={mutando}>
            {mutando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          <button type="button" onClick={fechar}>
            Cancelar
          </button>
        </form>
      )}

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Preço</th>
            <th>Categoria</th>
            <th>Marca</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nome}</td>
              <td>R$ {p.preco}</td>
              <td>{p.categoria.nome}</td>
              <td>{p.marca.nome}</td>
              <td>
                <button onClick={() => abrirEditar(p)}>Editar</button>
                <button onClick={() => handleDeletar(p.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SecaoCategorias() {
  const { data, carregando, erro } = useListarCategorias();
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const deletar = useDeletarCategoria();

  const categorias = data?.categorias ?? [];

  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "" });
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? "" });
  }

  function fechar() {
    setEditando(null);
    setForm({ nome: "", descricao: "" });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { nome: form.nome, descricao: form.descricao || undefined };

    if (editando) {
      const ok = await atualizar.executar(
        `/api/categorias/${editando.id}`,
        body,
      );
      if (ok) fechar();
    } else {
      const ok = await criar.executar("/api/categorias", body);
      if (ok) fechar();
    }
  }

  async function handleDeletar(id: number) {
    if (!confirm("Deletar categoria?")) return;
    await deletar.executar(`/api/categorias/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section>
      <h2>Categorias</h2>
      <button onClick={abrirCriar}>+ Nova Categoria</button>

      {(editando !== null || form.nome !== "") && (
        <form onSubmit={handleSubmit}>
          <h3>{editando ? "Editar Categoria" : "Nova Categoria"}</h3>

          <div>
            <label>Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <input
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>

          {erroMutacao && <p style={{ color: "red" }}>{erroMutacao}</p>}

          <button type="submit" disabled={mutando}>
            {mutando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          <button type="button" onClick={fechar}>
            Cancelar
          </button>
        </form>
      )}

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.nome}</td>
              <td>{c.descricao ?? "—"}</td>
              <td>
                <button onClick={() => abrirEditar(c)}>Editar</button>
                <button onClick={() => handleDeletar(c.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SecaoMarcas() {
  const { data, carregando, erro } = useListarMarcas();
  const criar = useCriarMarca();
  const atualizar = useAtualizarMarca();
  const deletar = useDeletarMarca();

  const marcas = data?.marcas ?? [];

  const [editando, setEditando] = useState<Marca | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", usuarioId: "" });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", usuarioId: "" });
  }

  function abrirEditar(m: Marca) {
    setEditando(m);
    setForm({
      nome: m.nome,
      descricao: m.descricao ?? "",
      usuarioId: String(m.usuarioId),
    });
  }

  function fechar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", usuarioId: "" });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editando) {
      const body = { nome: form.nome, descricao: form.descricao || undefined };
      const ok = await atualizar.executar(`/api/marcas/${editando.id}`, body);
      if (ok) fechar();
    } else {
      const body = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        usuarioId: Number(form.usuarioId),
      };
      const ok = await criar.executar("/api/marcas", body);
      if (ok) fechar();
    }
  }

  async function handleDeletar(id: number) {
    if (!confirm("Deletar marca?")) return;
    await deletar.executar(`/api/marcas/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section>
      <h2>Marcas</h2>
      <button onClick={abrirCriar}>+ Nova Marca</button>

      {(editando !== null || form.nome !== "") && (
        <form onSubmit={handleSubmit}>
          <h3>{editando ? "Editar Marca" : "Nova Marca"}</h3>

          <div>
            <label>Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <input
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>

          {!editando && (
            <div>
              <label>ID do Usuário responsável</label>
              <input
                name="usuarioId"
                type="number"
                value={form.usuarioId}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {erroMutacao && <p style={{ color: "red" }}>{erroMutacao}</p>}

          <button type="submit" disabled={mutando}>
            {mutando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          <button type="button" onClick={fechar}>
            Cancelar
          </button>
        </form>
      )}

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Responsável</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.nome}</td>
              <td>{m.descricao ?? "—"}</td>
              <td>{m.usuario.nome}</td>
              <td>
                <button onClick={() => abrirEditar(m)}>Editar</button>
                <button onClick={() => handleDeletar(m.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SecaoCertificados() {
  const { data, carregando, erro } = useListarCertificados();
  const criar = useCriarCertificado();
  const atualizar = useAtualizarCertificado();
  const deletar = useDeletarCertificado();

  const certificados = data?.certificados ?? [];

  const [editando, setEditando] = useState<Certificado | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    orgaoEmissor: "",
  });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", orgaoEmissor: "" });
  }

  function abrirEditar(c: Certificado) {
    setEditando(c);
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? "",
      orgaoEmissor: c.orgaoEmissor,
    });
  }

  function fechar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", orgaoEmissor: "" });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      orgaoEmissor: form.orgaoEmissor,
    };

    if (editando) {
      const ok = await atualizar.executar(
        `/api/certificados/${editando.id}`,
        body,
      );
      if (ok) fechar();
    } else {
      const ok = await criar.executar("/api/certificados", body);
      if (ok) fechar();
    }
  }

  async function handleDeletar(id: number) {
    if (!confirm("Deletar certificado?")) return;
    await deletar.executar(`/api/certificados/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section>
      <h2>Certificados</h2>
      <button onClick={abrirCriar}>+ Novo Certificado</button>

      {(editando !== null || form.nome !== "") && (
        <form onSubmit={handleSubmit}>
          <h3>{editando ? "Editar Certificado" : "Novo Certificado"}</h3>

          <div>
            <label>Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Descrição</label>
            <input
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Órgão Emissor</label>
            <input
              name="orgaoEmissor"
              value={form.orgaoEmissor}
              onChange={handleChange}
              required
            />
          </div>

          {erroMutacao && <p style={{ color: "red" }}>{erroMutacao}</p>}

          <button type="submit" disabled={mutando}>
            {mutando ? "Salvando..." : editando ? "Salvar" : "Criar"}
          </button>
          <button type="button" onClick={fechar}>
            Cancelar
          </button>
        </form>
      )}

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Órgão Emissor</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {certificados.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.nome}</td>
              <td>{c.orgaoEmissor}</td>
              <td>{c.descricao ?? "—"}</td>
              <td>
                <button onClick={() => abrirEditar(c)}>Editar</button>
                <button onClick={() => handleDeletar(c.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
