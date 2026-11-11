// app/(admin)/painel/page.tsx

/**
 * ============================================================================
 * PAINEL ADMINISTRATIVO
 * ============================================================================
 * Rota: "/painel" (protegida - apenas ADMIN)
 *
 * Painel completo para gerenciamento da plataforma EcoShop.
 * Requer autenticação e tipo de usuário ADMIN.
 *
 * Funcionalidades por aba:
 * - Produtos: CRUD completo (criar, editar, deletar, gerenciar fotos)
 * - Categorias: CRUD de categorias
 * - Marcas: CRUD de marcas (associadas a usuários)
 * - Certificados: CRUD de certificados de sustentabilidade
 *
 * Segurança:
 * - Apenas usuários com tipo "ADMIN" têm acesso
 * - Middleware requireAdmin protege a rota
 * - Todas as operações de API validam permissões novamente
 *
 * @see app/_middleware/auth.ts - requireAdmin
 * @see lib/hooks/* - Hooks para operações CRUD
 * ============================================================================
 */

"use client";

import { useState, useRef, useEffect } from "react";
import {
  useListPhotos,
  useUploadPhoto,
  useDeletePhoto,
} from "@/lib/hooks/useFotos";


import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks/useProdutos";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/useCategorias";
import {
  useListBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useApproveBrand,
} from "@/lib/hooks/useMarcas";
import {
  useListCertificates,
  useCreateCertificate,
  useUpdateCertificate,
  useDeleteCertificate,
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

// ============================================================================
// PÁGINA PRINCIPAL DO PAINEL
// ============================================================================

function PainelPage() {
  const [aba, setAba] = useState<Aba>("produtos");

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header))]">
      {/* SIDEBAR - Desktop */}
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 min-w-0 bg-[var(--color-bg-body)]">
        {/* Header fixo com título da aba atual */}
        <div className="sticky top-[var(--spacing-header)] z-10 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs mobile (scroll horizontal) */}
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

            {/* Título desktop */}
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

        {/* Conteúdo da aba selecionada */}
        <div className="p-6">
          {aba === "produtos" && <ProductsSection />}
          {aba === "categorias" && <CategoriesSection />}
          {aba === "marcas" && <BrandsSection />}
          {aba === "certificados" && <CertificatesSection />}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// COMPONENTES REUTILIZÁVEIS
// ============================================================================

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

/**
 * Modal para gerenciar fotos de um produto específico.
 * Permite upload, visualização e deleção de imagens.
 */
interface PhotosModalProps {
  produto: Produto;
  isOpen: boolean;
  onClose: () => void;
  onFotoAdicionada: () => void;
}

function PhotosModal({
  produto: product,
  isOpen,
  onClose,
  onFotoAdicionada,
}: PhotosModalProps) {
  const {
    data: fotosData,
    loading: carregando,
    error: erro,
  } = useListPhotos(isOpen ? product.id : (null as unknown as number));
  const uploadMutation = useUploadPhoto(product.id);
  const deleteMutation = useDeletePhoto(product.id);

  const photos = fotosData?.fotos ?? [];

  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa erro de upload ao abrir modal
  useEffect(() => {
    if (isOpen) setErroUpload(null);
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErroUpload(null);
    const formData = new FormData();
    formData.append("arquivo", file);

    const result = await uploadMutation.executar(
      `/api/produtos/${product.id}/fotos`,
      formData,
    );

    if (result) {
      onFotoAdicionada();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setErroUpload(uploadMutation.erro ?? "Erro ao fazer upload");
    }
  };

  const handleDeletePhoto = async (fileName: string) => {
    if (!confirm("Tem certeza que deseja deletar esta foto?")) return;

    setErroUpload(null);
    const result = await deleteMutation.executar(
      `/api/produtos/${product.id}/fotos?nome=${encodeURIComponent(fileName)}`,
    );

    if (!result) {
      setErroUpload(deleteMutation.erro ?? "Erro ao deletar foto");
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
              {product.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Área de upload */}
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
                disabled={uploadMutation.carregando}
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
                    uploadMutation.carregando
                      ? "border-[var(--color-border)] bg-[var(--color-bg-body)]"
                      : "border-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10"
                  }
                `}
              >
                {uploadMutation.carregando ? (
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

          {/* Galeria de fotos existentes */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Fotos Existentes ({photos.length})
            </label>

            {carregando ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <p className="text-center py-8 text-[var(--color-text-secondary)]">
                Nenhuma foto ainda. Adicione uma acima!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.nome}
                    className="relative group rounded-lg overflow-hidden bg-[var(--color-bg-body)]"
                  >
                    <img
                      src={photo.url}
                      alt={photo.nome}
                      className="w-full h-40 object-cover"
                    />

                    {/* Overlay com ações ao hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden group-hover:flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        title="Abrir em nova aba"
                      >
                        🔗
                      </a>
                      <button
                        onClick={() => handleDeletePhoto(photo.nome)}
                        className="hidden group-hover:flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Deletar foto"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Nome do arquivo */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-xs text-white truncate">{photo.nome}</p>
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

// ============================================================================
// SEÇÃO: PRODUTOS
// ============================================================================

function ProductsSection() {
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
  const [certificateIds, setCertificadoIds] = useState<number[]>([]);

  const { data: produtosData, loading: carregando, error: erro } = useListProducts(1, 100);
  const productList = produtosData?.produtos ?? [];

  const { data: categoriasData } = useListCategories();
  const categories = categoriasData?.categorias ?? [];

  const { data: marcasData } = useListBrands();
  const brands = marcasData?.marcas ?? [];

  const { data: certificadosData } = useListCertificates();
  const certificates = certificadosData?.certificados ?? [];

  const create = useCreateProduct();
  const atualizar = useUpdateProduct();
  const deletar = useDeleteProduct();

  const handleAbrirModal = (product?: Produto) => {
    if (product) {
      setEditando(product);
      setForm({
        nome: product.nome,
        descricao: product.descricao || "",
        preco: String(product.preco),
        categoriaId: String(product.categoriaId),
        marcaId: String(product.marcaId),
      });
      setCertificadoIds(
        (product.certificados ?? []).map((pc) => pc.certificado.id),
      );
    } else {
      setEditando(null);
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        categoriaId: "",
        marcaId: "",
      });
      setCertificadoIds([]);
    }
    setModalAberto(true);
  };

  function toggleCertificate(id: number) {
    setCertificadoIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const handleSalvar = async () => {
    if (!form.nome || !form.preco || !form.categoriaId || !form.marcaId) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (editando) {
      await atualizar.executar(`/api/produtos/${editando.id}`, {
        nome: form.nome,
        descricao: form.descricao || undefined,
        preco: parseFloat(form.preco),
        categoriaId: parseInt(form.categoriaId),
        marcaId: parseInt(form.marcaId),
        certificadoIds: certificateIds,
      });
    } else {
      await create.executar("/api/produtos", {
        nome: form.nome,
        descricao: form.descricao || undefined,
        preco: parseFloat(form.preco),
        categoriaId: parseInt(form.categoriaId),
        marcaId: parseInt(form.marcaId),
      });
    }

    setModalAberto(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    await deletar.executar(`/api/produtos/${id}`);
  };

  const handleOpenPhotos = (product: Produto) => {
    setProdutoSelecionado(product);
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
      ) : productList.length === 0 ? (
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
            {productList.map((product) => (
              <tr key={product.id}>
                <Td>{product.nome}</Td>
                <Td>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(product.preco))}
                </Td>
                <Td>{product.categoria?.nome || "Categoria não definida"}</Td>
                <Td>{product.marca?.nome || "Marca não definida"}</Td>
                <Td className="space-x-2">
                  <ActionButton
                    variant="edit"
                    onClick={() => handleAbrirModal(product)}
                  >
                    ✏️ Editar
                  </ActionButton>
                  <ActionButton
                    variant="edit"
                    onClick={() => handleOpenPhotos(product)}
                  >
                    📸 Fotos
                  </ActionButton>
                  <ActionButton
                    variant="delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    🗑️ Deletar
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      )}

      {/* Modal de criação/edição */}
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
              options={categories.map((c) => ({ id: c.id, nome: c.nome }))}
            />
            <Field
              label="Marca"
              value={form.marcaId}
              onChange={(e) => setForm({ ...form, marcaId: e.target.value })}
              type="select"
              options={brands.map((m) => ({ id: m.id, nome: m.nome }))}
            />
            {editando && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Certificados
                </label>
                {certificates.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    Nenhum certificado cadastrado ainda.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {certificates.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={certificateIds.includes(c.id)}
                          onChange={() => toggleCertificate(c.id)}
                        />
                        {c.nome}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSalvar}
                disabled={create.carregando || atualizar.carregando}
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {" "}
                {editando ? "Atualizar" : "Criar"}{" "}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-hover)]"
              >
                {" "}
                Cancelar{" "}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de gerenciamento de fotos */}
      {produtoSelecionado && (
        <PhotosModal
          produto={produtoSelecionado}
          isOpen={modalFotosAberto}
          onClose={() => {
            setModalFotosAberto(false);
            setProdutoSelecionado(null);
          }}
          onFotoAdicionada={() => {}}
        />
      )}
    </>
  );
}

// ============================================================================
// SEÇÃO: CATEGORIAS
// ============================================================================

function CategoriesSection() {
  const { data, loading: carregando, error: erro } = useListCategories();
  const create = useCreateCategory();
  const atualizar = useUpdateCategory();
  const deletar = useDeleteCategory();

  const categories = data?.categorias ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  function openCreate() {
    setEditando(null);
    setForm({ nome: "", descricao: "" });
    setModalAberto(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? "" });
    setModalAberto(true);
  }

  function close() {
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
      if (ok) close();
    } else {
      const ok = await create.executar("/api/categorias", body);
      if (ok) close();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;
    await deletar.executar(`/api/categorias/${id}`);
  }

  const mutando = create.carregando || atualizar.carregando;
  const mutationError = create.erro || atualizar.erro || deletar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Lista de Categorias"
        onAdd={openCreate}
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
          ) : categories.length === 0 ? (
            <EmptyRow cols={4} message="Nenhuma categoria cadastrada ainda." />
          ) : (
            categories.map((c) => (
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
                      onClick={() => handleDelete(c.id)}
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
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutando}
        error={mutationError}
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

// ============================================================================
// SEÇÃO: MARCAS
// ============================================================================

function BrandsSection() {
  const { data, loading: carregando, error: erro } = useListBrands();
  const create = useCreateBrand();
  const atualizar = useUpdateBrand();
  const deletar = useDeleteBrand();
  const aprovar = useApproveBrand();

  const brands = data?.marcas ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Marca | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", usuarioId: "" });

  function openCreate() {
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

  function close() {
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
      if (ok) close();
    } else {
      const body = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        usuarioId: Number(form.usuarioId),
      };
      const ok = await create.executar("/api/marcas", body);
      if (ok) close();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja deletar esta marca?")) return;
    await deletar.executar(`/api/marcas/${id}`);
  }

  async function handleApprove(id: number) {
    await aprovar.executar(`/api/marcas/${id}/aprovar`);
  }

  const mutando = create.carregando || atualizar.carregando;
  const mutationError =
    create.erro || atualizar.erro || deletar.erro || aprovar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Lista de Marcas"
        onAdd={openCreate}
        addLabel="Nova Marca"
      />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Descrição</Th>
            <Th>Responsável</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <LoadingRow cols={6} />
          ) : erro ? (
            <EmptyRow cols={6} message={`Erro ao carregar: ${erro}`} />
          ) : brands.length === 0 ? (
            <EmptyRow cols={6} message="Nenhuma marca cadastrada ainda." />
          ) : (
            brands.map((m) => (
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
                      {m.usuario?.nome.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-sm">
                      {m.usuario?.nome || "Usuário não definido"}
                    </span>
                  </div>
                </Td>
                <Td>
                  <BrandStatusBadge status={m.status} />
                </Td>
                <Td>
                  <div className="flex gap-2">
                    {m.status === "PENDENTE" && (
                      <ActionButton
                        variant="approve"
                        onClick={() => handleApprove(m.id)}
                      >
                        ✅ Aprovar
                      </ActionButton>
                    )}
                    <ActionButton variant="edit" onClick={() => abrirEditar(m)}>
                      ✏️ Editar
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDelete(m.id)}
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
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutando}
        error={mutationError}
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

// ============================================================================
// SEÇÃO: CERTIFICADOS
// ============================================================================

function CertificatesSection() {
  const { data, loading: carregando, error: erro } = useListCertificates();
  const create = useCreateCertificate();
  const atualizar = useUpdateCertificate();
  const deletar = useDeleteCertificate();

  const certificates = data?.certificados ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Certificado | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    orgaoEmissor: "",
  });

  function openCreate() {
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

  function close() {
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
      if (ok) close();
    } else {
      const ok = await create.executar("/api/certificados", body);
      if (ok) close();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja deletar este certificado?")) return;
    await deletar.executar(`/api/certificados/${id}`);
  }

  const mutando = create.carregando || atualizar.carregando;
  const mutationError = create.erro || atualizar.erro || deletar.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Lista de Certificados"
        onAdd={openCreate}
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
          ) : certificates.length === 0 ? (
            <EmptyRow cols={5} message="Nenhum certificado cadastrado ainda." />
          ) : (
            certificates.map((c) => (
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
                      onClick={() => handleDelete(c.id)}
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
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutando}
        error={mutationError}
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

// ============================================================================
// COMPONENTES AUXILIARES REUTILIZÁVEIS
// ============================================================================

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
  variant: "edit" | "delete" | "approve";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
        variant === "edit"
          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
          : variant === "approve"
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** Rótulo visual do status de aprovação de uma marca (ADR-0018). */
function BrandStatusBadge({ status }: { status: Marca["status"] }) {
  const estilos: Record<Marca["status"], string> = {
    PENDENTE: "bg-amber-50 text-amber-700",
    APROVADA: "bg-emerald-50 text-emerald-700",
    REJEITADA: "bg-red-50 text-red-600",
  };
  const rotulos: Record<Marca["status"], string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    REJEITADA: "Rejeitada",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${estilos[status]}`}
    >
      {rotulos[status]}
    </span>
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
  onChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
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

export default PainelPage;
