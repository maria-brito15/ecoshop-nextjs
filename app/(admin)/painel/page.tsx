// app/(admin)/painel/page.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useFotos, type Foto } from "@/lib/hooks/useFotos";

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

const ABA_CONFIG: Record<Aba, { label: string; icon: string; desc: string }> = {
  produtos: {
    label: "Produtos",
    icon: "📦",
    desc: "Gerencie o catálogo de produtos",
  },
  categorias: {
    label: "Categorias",
    icon: "🏷️",
    desc: "Organize os produtos em categorias",
  },
  marcas: { label: "Marcas", icon: "🤝", desc: "Gerencie as marcas parceiras" },
  certificados: {
    label: "Certificados",
    icon: "🌿",
    desc: "Gerencie certificações de sustentabilidade",
  },
};

export default function PainelPage() {
  const [aba, setAba] = useState<Aba>("produtos");

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header))]">
      <aside
        className="
          hidden lg:flex flex-col
          w-64 shrink-0
          border-r border-[var(--color-border)]
          bg-[var(--color-bg-surface)]
          sticky top-[var(--spacing-header)]
          h-[calc(100vh-var(--spacing-header))]
          overflow-y-auto
        "
      >
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="font-bold text-sm text-[var(--color-text-primary)] font-[var(--font-display)]">
                EcoShop
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Painel Admin
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {(
            Object.entries(ABA_CONFIG) as [Aba, (typeof ABA_CONFIG)[Aba]][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setAba(key)}
              className={`
                  group w-full flex items-center gap-3
                  px-4 py-3 rounded-[var(--radius-btn)]
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    aba === key
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                  }
                `}
            >
              <span
                className={`
                    w-9 h-9 flex items-center justify-center rounded-lg text-base
                    transition-all duration-200
                    ${
                      aba === key
                        ? "bg-[var(--color-primary)] shadow-[var(--shadow-btn)]"
                        : "bg-[var(--color-bg-body)] group-hover:bg-[var(--color-primary-light)]"
                    }
                  `}
              >
                {cfg.icon}
              </span>
              {cfg.label}
              {aba === key && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-sm">
              👤
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                Administrador
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                admin@ecoshop.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-[var(--color-bg-body)]">
        <div className="sticky top-[var(--spacing-header)] z-10 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 lg:hidden overflow-x-auto pb-0.5 scrollbar-hide">
              {(
                Object.entries(ABA_CONFIG) as [Aba, (typeof ABA_CONFIG)[Aba]][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setAba(key)}
                  className={`
                      shrink-0 flex items-center gap-1.5
                      px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-200 border
                      ${
                        aba === key
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      }
                    `}
                >
                  <span>{cfg.icon}</span>
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:block">
              <h1
                className="text-xl font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {ABA_CONFIG[aba].label}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {ABA_CONFIG[aba].desc}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {aba === "produtos" && <SecaoProdutos />}
          {aba === "categorias" && <SecaoCategorias />}
          {aba === "marcas" && <SecaoMarcas />}
          {aba === "certificados" && <SecaoCertificados />}
        </div>
      </main>
    </div>
  );
}

const inputCls = `
  w-full px-3.5 py-2.5
  rounded-xl
  border border-[var(--color-border)]
  bg-[var(--color-bg-body)]
  text-sm text-[var(--color-text-primary)]
  placeholder:text-[var(--color-text-tertiary)]
  focus:outline-none
  focus:border-[var(--color-primary)]
  focus:ring-2 focus:ring-[var(--color-primary-light)]
  transition-all duration-200
  font-[var(--font-body)]
`;

interface ModalFotosProps {
  produto: Produto;
  isOpen: boolean;
  onClose: () => void;
  onFotoAdicionada: () => void;
}

function ModalFotos({
  produto,
  isOpen,
  onClose,
  onFotoAdicionada,
}: ModalFotosProps) {
  const { fotos, carregando, erro, carregar, upload, deletar } = useFotos(
    produto.id,
  );
  const [enviando, setEnviando] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      carregar();
    }
  }, [isOpen, carregar]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    setErroUpload(null);

    try {
      await upload(arquivo);
      onFotoAdicionada();
      await carregar();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setErroUpload(err.message || "Erro ao fazer upload");
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteFoto = async (nomeArquivo: string) => {
    if (!confirm("Tem certeza que deseja deletar esta foto?")) return;

    try {
      await deletar(nomeArquivo);
      await carregar();
    } catch (err: any) {
      setErroUpload(err.message || "Erro ao deletar foto");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Fotos do Produto
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {produto.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Adicionar Nova Foto
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={enviando}
                className="hidden"
                id="foto-input"
              />
              <label
                htmlFor="foto-input"
                className={`
                  flex items-center justify-center gap-3
                  p-8 rounded-xl border-2 border-dashed
                  cursor-pointer transition-all
                  ${
                    enviando
                      ? "border-[var(--color-border)] bg-[var(--color-bg-body)]"
                      : "border-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10"
                  }
                `}
              >
                {enviando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Enviando...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📸</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Clique para selecionar uma imagem
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        JPG, PNG, WebP ou GIF (máx. 5MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
            {erroUpload && (
              <p className="text-sm text-red-600 mt-2">❌ {erroUpload}</p>
            )}
            {erro && <p className="text-sm text-red-600 mt-2">❌ {erro}</p>}
          </div>

          {/* Lista de Fotos */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Fotos Existentes ({fotos.length})
            </label>

            {carregando ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fotos.length === 0 ? (
              <p className="text-center py-8 text-[var(--color-text-secondary)]">
                Nenhuma foto ainda. Adicione uma acima!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {fotos.map((foto) => (
                  <div
                    key={foto.nome}
                    className="relative group rounded-lg overflow-hidden bg-[var(--color-bg-body)]"
                  >
                    <img
                      src={foto.url}
                      alt={foto.nome}
                      className="w-full h-40 object-cover"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2">
                      <a
                        href={foto.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden group-hover:flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        title="Abrir em nova aba"
                      >
                        🔗
                      </a>
                      <button
                        onClick={() => handleDeleteFoto(foto.nome)}
                        className="hidden group-hover:flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Deletar foto"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-xs text-white truncate">{foto.nome}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-body)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// FIX 1: renamed from SecaoProdutosComFotos → SecaoProdutos to match usage in PainelPage
export function SecaoProdutos() {
  const [modalFotosAberto, setModalFotosAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoriaId: "",
    marcaId: "",
  });

  // FIX 2: was `{ fotos: listaProdutos }` — `fotos` doesn't exist on useFetch result.
  // Correct key is `data`, then extract the `produtos` array from the response shape.
  const { data: produtosData, carregando, erro } = useListarProdutos(1, 100);
  const listaProdutos = produtosData?.produtos ?? [];

  // FIX 3: was `{ data: categorias }` — `data` is the full response object
  // `{ categorias: [...] }`, not the array itself. Extract the nested array.
  const { data: categoriasData } = useListarCategorias();
  const categorias = categoriasData?.categorias ?? [];

  // FIX 4: same issue as categorias above.
  const { data: marcasData } = useListarMarcas();
  const marcas = marcasData?.marcas ?? [];

  const criar = useCriarProduto();
  const atualizar = useAtualizarProduto();
  const deletar = useDeletarProduto();

  const handleAbrirModal = (produto?: Produto) => {
    if (produto) {
      setEditando(produto);
      setForm({
        nome: produto.nome,
        descricao: produto.descricao || "",
        preco: String(produto.preco),
        categoriaId: String(produto.categoriaId),
        marcaId: String(produto.marcaId),
      });
    } else {
      setEditando(null);
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        categoriaId: "",
        marcaId: "",
      });
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.preco || !form.categoriaId || !form.marcaId) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const dados = {
      nome: form.nome,
      descricao: form.descricao,
      preco: parseFloat(form.preco),
      categoriaId: parseInt(form.categoriaId),
      marcaId: parseInt(form.marcaId),
    };

    if (editando) {
      await atualizar.executar(`/api/produtos/${editando.id}`, dados);
    } else {
      await criar.executar("/api/produtos", dados);
    }

    setModalAberto(false);
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    await deletar.executar(`/api/produtos/${id}`);
  };

  const handleAbrirFotos = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalFotosAberto(true);
  };

  return (
    <>
      <SectionHeader
        title="Produtos"
        onAdd={() => handleAbrirModal()}
        addLabel="Novo Produto"
      />

      {erro && <ErrorMessage message={erro} />}

      {carregando ? (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Preço</Th>
              <Th>Categoria</Th>
              <Th>Marca</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            <LoadingRow cols={5} />
          </tbody>
        </TableContainer>
      ) : listaProdutos.length === 0 ? (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Preço</Th>
              <Th>Categoria</Th>
              <Th>Marca</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            <EmptyRow cols={5} message="Nenhum produto cadastrado" />
          </tbody>
        </TableContainer>
      ) : (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Preço</Th>
              <Th>Categoria</Th>
              <Th>Marca</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {listaProdutos.map((produto) => (
              <tr key={produto.id}>
                <Td>{produto.nome}</Td>
                <Td>R$ {parseFloat(String(produto.preco)).toFixed(2)}</Td>
                <Td>{produto.categoria.nome}</Td>
                <Td>{produto.marca.nome}</Td>
                <Td className="space-x-2">
                  <ActionButton
                    variant="edit"
                    onClick={() => handleAbrirModal(produto)}
                  >
                    ✏️ Editar
                  </ActionButton>
                  <ActionButton
                    variant="edit"
                    onClick={() => handleAbrirFotos(produto)}
                  >
                    📸 Fotos
                  </ActionButton>
                  <ActionButton
                    variant="delete"
                    onClick={() => handleDeletar(produto.id)}
                  >
                    🗑️ Deletar
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      )}

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <Modal
          title={editando ? "Editar Produto" : "Novo Produto"}
          onClose={() => setModalAberto(false)}
        >
          <div className="space-y-4">
            <Field
              label="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome do produto"
            />
            <Field
              label="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição"
              type="textarea"
            />
            <Field
              label="Preço"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              placeholder="0.00"
              type="number"
            />
            <Field
              label="Categoria"
              value={form.categoriaId}
              onChange={(e) =>
                setForm({ ...form, categoriaId: e.target.value })
              }
              type="select"
              options={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
            />
            <Field
              label="Marca"
              value={form.marcaId}
              onChange={(e) => setForm({ ...form, marcaId: e.target.value })}
              type="select"
              options={marcas.map((m) => ({ id: m.id, nome: m.nome }))}
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSalvar}
                disabled={criar.carregando || atualizar.carregando}
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {editando ? "Atualizar" : "Criar"}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-hover)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Fotos */}
      {produtoSelecionado && (
        <ModalFotos
          produto={produtoSelecionado}
          isOpen={modalFotosAberto}
          onClose={() => {
            setModalFotosAberto(false);
            setProdutoSelecionado(null);
          }}
          onFotoAdicionada={() => {
            // Aqui você pode atualizar a lista de produtos se necessário
          }}
        />
      )}
    </>
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] text-white text-sm font-semibold shadow-[var(--shadow-btn)] hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all duration-200"
      >
        <span className="text-base leading-none">+</span>
        {addLabel}
      </button>
    </div>
  );
}

function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] bg-[var(--color-bg-body)] border-b border-[var(--color-border)] whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-[var(--color-text-primary)] border-b border-[var(--color-border)] align-middle ${className}`}
    >
      {children}
    </td>
  );
}

function ActionButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "edit" | "delete";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
        variant === "edit"
          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
          : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)]">
          <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center">
        <p className="text-[var(--color-text-secondary)]">{message}</p>
      </td>
    </tr>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
      ❌ {message}
    </div>
  );
}

// FIX 5: Modal was missing `open`, `onSubmit`, `loading`, and `error` props that
// SecaoCategorias, SecaoMarcas and SecaoCertificados all pass to it.
function Modal({
  title,
  onClose,
  children,
  open,
  onSubmit,
  loading,
  error,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  open?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
}) {
  // When used with `open` prop (SecaoCategorias/Marcas/Certificados style),
  // respect it; when used without (SecaoProdutos inline style), always render.
  if (open === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            {error && <ErrorMessage message={error} />}
            {children}
            {onSubmit && (
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 font-semibold"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-hover)]"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// FIX 6: Field was used two different ways — as a wrapper `<Field label="X"><input .../></Field>`
// in SecaoCategorias/Marcas/Certificados, but as a self-contained field with value/onChange
// in SecaoProdutos. The original only supported the self-contained style, so `children` was
// missing. Updated to support both: if `children` is provided it renders as a label wrapper;
// otherwise it falls back to the original controlled input/select/textarea behavior.
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options = [],
  children,
}: {
  label: string;
  value?: string;
  onChange?: (e: any) => void;
  placeholder?: string;
  type?: string;
  options?: { id: number; nome: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
        {label}
      </label>
      {children ? (
        children
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          rows={3}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Selecione...</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nome}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      )}
    </div>
  );
}

function SecaoCategorias() {
  const { data, carregando, erro } = useListarCategorias();
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const deletar = useDeletarCategoria();

  const categorias = data?.categorias ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "" });
    setModalAberto(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? "" });
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
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
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;
    await deletar.executar(`/api/categorias/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {erroMutacao && <ErrorMessage message={erroMutacao} />}

      <SectionHeader
        title="Lista de Categorias"
        onAdd={abrirCriar}
        addLabel="Nova Categoria"
      />

      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Descrição</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <LoadingRow cols={4} />
          ) : erro ? (
            <EmptyRow cols={4} message={`Erro ao carregar: ${erro}`} />
          ) : categorias.length === 0 ? (
            <EmptyRow cols={4} message="Nenhuma categoria cadastrada ainda." />
          ) : (
            categorias.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-[var(--color-bg-body)] transition-colors duration-150"
              >
                <Td>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                    #{c.id}
                  </span>
                </Td>
                <Td>
                  <span className="font-medium">{c.nome}</span>
                </Td>
                <Td className="text-[var(--color-text-secondary)] max-w-xs truncate">
                  {c.descricao ?? "—"}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <ActionButton variant="edit" onClick={() => abrirEditar(c)}>
                      ✏️ Editar
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDeletar(c.id)}
                    >
                      🗑️ Deletar
                    </ActionButton>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableContainer>

      <Modal
        open={modalAberto}
        title={editando ? "Editar Categoria" : "Nova Categoria"}
        onClose={fechar}
        onSubmit={handleSubmit}
        loading={mutando}
        error={erroMutacao}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome da categoria"
            required
            className={inputCls}
          />
        </Field>

        <Field label="Descrição">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição opcional"
            className={inputCls}
          />
        </Field>
      </Modal>
    </section>
  );
}

function SecaoMarcas() {
  const { data, carregando, erro } = useListarMarcas();
  const criar = useCriarMarca();
  const atualizar = useAtualizarMarca();
  const deletar = useDeletarMarca();

  const marcas = data?.marcas ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Marca | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", usuarioId: "" });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", usuarioId: "" });
    setModalAberto(true);
  }

  function abrirEditar(m: Marca) {
    setEditando(m);
    setForm({
      nome: m.nome,
      descricao: m.descricao ?? "",
      usuarioId: String(m.usuarioId),
    });
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
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
    if (!confirm("Tem certeza que deseja deletar esta marca?")) return;
    await deletar.executar(`/api/marcas/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {erroMutacao && <ErrorMessage message={erroMutacao} />}

      <SectionHeader
        title="Lista de Marcas"
        onAdd={abrirCriar}
        addLabel="Nova Marca"
      />

      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Descrição</Th>
            <Th>Responsável</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <LoadingRow cols={5} />
          ) : erro ? (
            <EmptyRow cols={5} message={`Erro ao carregar: ${erro}`} />
          ) : marcas.length === 0 ? (
            <EmptyRow cols={5} message="Nenhuma marca cadastrada ainda." />
          ) : (
            marcas.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-[var(--color-bg-body)] transition-colors duration-150"
              >
                <Td>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                    #{m.id}
                  </span>
                </Td>
                <Td>
                  <span className="font-medium">{m.nome}</span>
                </Td>
                <Td className="text-[var(--color-text-secondary)] max-w-xs truncate">
                  {m.descricao ?? "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                      {m.usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{m.usuario.nome}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <ActionButton variant="edit" onClick={() => abrirEditar(m)}>
                      ✏️ Editar
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDeletar(m.id)}
                    >
                      🗑️ Deletar
                    </ActionButton>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableContainer>

      <Modal
        open={modalAberto}
        title={editando ? "Editar Marca" : "Nova Marca"}
        onClose={fechar}
        onSubmit={handleSubmit}
        loading={mutando}
        error={erroMutacao}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome da marca"
            required
            className={inputCls}
          />
        </Field>

        <Field label="Descrição">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição opcional"
            className={inputCls}
          />
        </Field>

        {!editando && (
          <Field label="ID do Usuário Responsável">
            <input
              name="usuarioId"
              type="number"
              value={form.usuarioId}
              onChange={handleChange}
              placeholder="Ex: 1"
              required
              className={inputCls}
            />
          </Field>
        )}
      </Modal>
    </section>
  );
}

function SecaoCertificados() {
  const { data, carregando, erro } = useListarCertificados();
  const criar = useCriarCertificado();
  const atualizar = useAtualizarCertificado();
  const deletar = useDeletarCertificado();

  const certificados = data?.certificados ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Certificado | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    orgaoEmissor: "",
  });

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: "", descricao: "", orgaoEmissor: "" });
    setModalAberto(true);
  }

  function abrirEditar(c: Certificado) {
    setEditando(c);
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? "",
      orgaoEmissor: c.orgaoEmissor,
    });
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
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
    if (!confirm("Tem certeza que deseja deletar este certificado?")) return;
    await deletar.executar(`/api/certificados/${id}`);
  }

  const mutando = criar.carregando || atualizar.carregando;
  const erroMutacao = criar.erro || atualizar.erro || deletar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {erroMutacao && <ErrorMessage message={erroMutacao} />}

      <SectionHeader
        title="Lista de Certificados"
        onAdd={abrirCriar}
        addLabel="Novo Certificado"
      />

      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Órgão Emissor</Th>
            <Th>Descrição</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <LoadingRow cols={5} />
          ) : erro ? (
            <EmptyRow cols={5} message={`Erro ao carregar: ${erro}`} />
          ) : certificados.length === 0 ? (
            <EmptyRow cols={5} message="Nenhum certificado cadastrado ainda." />
          ) : (
            certificados.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-[var(--color-bg-body)] transition-colors duration-150"
              >
                <Td>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                    #{c.id}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-sm">
                      🌿
                    </span>
                    <span className="font-medium">{c.nome}</span>
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {c.orgaoEmissor}
                  </span>
                </Td>
                <Td className="text-[var(--color-text-secondary)] max-w-xs truncate">
                  {c.descricao ?? "—"}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <ActionButton variant="edit" onClick={() => abrirEditar(c)}>
                      ✏️ Editar
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDeletar(c.id)}
                    >
                      🗑️ Deletar
                    </ActionButton>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableContainer>

      <Modal
        open={modalAberto}
        title={editando ? "Editar Certificado" : "Novo Certificado"}
        onClose={fechar}
        onSubmit={handleSubmit}
        loading={mutando}
        error={erroMutacao}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do certificado"
            required
            className={inputCls}
          />
        </Field>

        <Field label="Órgão Emissor">
          <input
            name="orgaoEmissor"
            value={form.orgaoEmissor}
            onChange={handleChange}
            placeholder="Ex: INMETRO, IBD..."
            required
            className={inputCls}
          />
        </Field>

        <Field label="Descrição">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição opcional"
            className={inputCls}
          />
        </Field>
      </Modal>
    </section>
  );
}
