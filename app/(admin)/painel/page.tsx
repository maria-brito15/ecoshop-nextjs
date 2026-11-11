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
} from "@/lib/hooks/usePhotos";


import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks/useProducts";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/useCategories";
import {
  useListBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useApproveBrand,
} from "@/lib/hooks/useBrands";
import {
  useListCertificates,
  useCreateCertificate,
  useUpdateCertificate,
  useDeleteCertificate,
} from "@/lib/hooks/useCertificates";

import type { Produto, Categoria, Marca, Certificado } from "@/types/api";

type Tab = "produtos" | "categorias" | "marcas" | "certificados";

const TAB_CONFIG: Record<Tab, { label: string; icon: string; desc: string }> = {
  produtos: {
    label: "Produtos",
    icon: "📦",
    desc: "Manage the product catalog",
  },
  categorias: {
    label: "Categorias",
    icon: "🏷️",
    desc: "Organize products into categories",
  },
  marcas: { label: "Marcas", icon: "🤝", desc: "Gerencie as marcas parceiras" },
  certificados: {
    label: "Certificados",
    icon: "🌿",
    desc: "Manage sustainability certifications",
  },
};

// ============================================================================
// PÁGINA PRINCIPAL DO PAINEL
// ============================================================================

function DashboardPage() {
  const [tab, setTab] = useState<Tab>("produtos");

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
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {(
            Object.entries(TAB_CONFIG) as [Tab, (typeof TAB_CONFIG)[Tab]][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`
                  group w-full flex items-center gap-3
                  px-4 py-3 rounded-[var(--radius-btn)]
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    tab === key
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
                      tab === key
                        ? "bg-[var(--color-primary)] shadow-[var(--shadow-btn)]"
                        : "bg-[var(--color-bg-body)] group-hover:bg-[var(--color-primary-light)]"
                    }
                  `}
              >
                {cfg.icon}
              </span>
              {cfg.label}
              {tab === key && (
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
                Object.entries(TAB_CONFIG) as [Tab, (typeof TAB_CONFIG)[Tab]][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`
                    shrink-0 flex items-center gap-1.5
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 border
                    ${
                      tab === key
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
                {TAB_CONFIG[tab].label}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {TAB_CONFIG[tab].desc}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo da aba selecionada */}
        <div className="p-6">
          {tab === "produtos" && <ProductsSection />}
          {tab === "categorias" && <CategoriesSection />}
          {tab === "marcas" && <BrandsSection />}
          {tab === "certificados" && <CertificatesSection />}
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
  onFotoAdicionada: onPhotoAdded,
}: PhotosModalProps) {
  const {
    data: photosData,
    loading: loading,
    error: error,
  } = useListPhotos(isOpen ? product.id : (null as unknown as number));
  const uploadMutation = useUploadPhoto(product.id);
  const deleteMutation = useDeletePhoto(product.id);

  const photos = photosData?.fotos ?? [];

  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa erro de upload ao abrir modal
  useEffect(() => {
    if (isOpen) setUploadError(null);
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const formData = new FormData();
    formData.append("arquivo", file);

    const result = await uploadMutation.executar(
      `/api/produtos/${product.id}/fotos`,
      formData,
    );

    if (result) {
      onPhotoAdded();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setUploadError(uploadMutation.erro ?? "Error uploading");
    }
  };

  const handleDeletePhoto = async (fileName: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    setUploadError(null);
    const result = await deleteMutation.executar(
      `/api/produtos/${product.id}/fotos?nome=${encodeURIComponent(fileName)}`,
    );

    if (!result) {
      setUploadError(deleteMutation.erro ?? "Error deleting photo");
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
              Product Photos
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
              Add New Photo
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
                        Click to select an image
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        JPG, PNG, WebP or GIF (max. 5MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
            {uploadError && (
              <p className="text-sm text-red-600 mt-2">❌ {uploadError}</p>
            )}
            {error && <p className="text-sm text-red-600 mt-2">❌ {error}</p>}
          </div>

          {/* Galeria de fotos existentes */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Fotos Existentes ({photos.length})
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <p className="text-center py-8 text-[var(--color-text-secondary)]">
                No photos yet. Add one above!
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
                        title="Open in new tab"
                      >
                        🔗
                      </a>
                      <button
                        onClick={() => handleDeletePhoto(photo.nome)}
                        className="hidden group-hover:flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Delete photo"
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
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoriaId: "",
    marcaId: "",
  });
  const [certificateIds, setCertificateIds] = useState<number[]>([]);

  const { data: productsData, loading: loading, error: error } = useListProducts(1, 100);
  const productList = productsData?.produtos ?? [];

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData?.categorias ?? [];

  const { data: brandsData } = useListBrands();
  const brands = brandsData?.marcas ?? [];

  const { data: certificatesData } = useListCertificates();
  const certificates = certificatesData?.certificados ?? [];

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const handleOpenModal = (product?: Produto) => {
    if (product) {
      setEditing(product);
      setForm({
        nome: product.nome,
        descricao: product.descricao || "",
        preco: String(product.preco),
        categoriaId: String(product.categoriaId),
        marcaId: String(product.marcaId),
      });
      setCertificateIds(
        (product.certificados ?? []).map((pc) => pc.certificado.id),
      );
    } else {
      setEditing(null);
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        categoriaId: "",
        marcaId: "",
      });
      setCertificateIds([]);
    }
    setModalOpen(true);
  };

  function toggleCertificate(id: number) {
    setCertificateIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const handleSave = async () => {
    if (!form.nome || !form.preco || !form.categoriaId || !form.marcaId) {
      alert("Fill in all required fields");
      return;
    }

    if (editing) {
      await update.executar(`/api/produtos/${editing.id}`, {
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

    setModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await remove.executar(`/api/produtos/${id}`);
  };

  const handleOpenPhotos = (product: Produto) => {
    setSelectedProduct(product);
    setPhotosModalOpen(true);
  };

  return (
    <>
      <SectionHeader
        title="Produtos"
        onAdd={() => handleOpenModal()}
        addLabel="New Product"
      />

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Price</Th>
              <Th>Category</Th>
              <Th>Brand</Th>
              <Th>Actions</Th>
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
              <Th>Price</Th>
              <Th>Category</Th>
              <Th>Brand</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            <EmptyRow cols={5} message="No products registered" />
          </tbody>
        </TableContainer>
      ) : (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Price</Th>
              <Th>Category</Th>
              <Th>Brand</Th>
              <Th>Actions</Th>
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
                <Td>{product.categoria?.nome || "Category not set"}</Td>
                <Td>{product.marca?.nome || "Brand not set"}</Td>
                <Td className="space-x-2">
                  <ActionButton
                    variant="edit"
                    onClick={() => handleOpenModal(product)}
                  >
                    ✏️ Edit
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
      {modalOpen && (
        <Modal
          title={editing ? "Edit Product" : "New Product"}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <Field
              label="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Product name"
            />
            <Field
              label="Description"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Description"
              type="textarea"
            />
            <Field
              label="Price"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              placeholder="0.00"
              type="number"
            />
            <Field
              label="Category"
              value={form.categoriaId}
              onChange={(e) =>
                setForm({ ...form, categoriaId: e.target.value })
              }
              type="select"
              options={categories.map((c) => ({ id: c.id, nome: c.nome }))}
            />
            <Field
              label="Brand"
              value={form.marcaId}
              onChange={(e) => setForm({ ...form, marcaId: e.target.value })}
              type="select"
              options={brands.map((m) => ({ id: m.id, nome: m.nome }))}
            />
            {editing && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Certificados
                </label>
                {certificates.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    No certificates registered yet.
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
                onClick={handleSave}
                disabled={create.carregando || update.carregando}
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {" "}
                {editing ? "Atualizar" : "Create"}{" "}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-hover)]"
              >
                {" "}
                Cancel{" "}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de gerenciamento de fotos */}
      {selectedProduct && (
        <PhotosModal
          produto={selectedProduct}
          isOpen={photosModalOpen}
          onClose={() => {
            setPhotosModalOpen(false);
            setSelectedProduct(null);
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
  const { data, loading: loading, error: error } = useListCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const categories = data?.categorias ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  function openCreate() {
    setEditing(null);
    setForm({ nome: "", descricao: "" });
    setModalOpen(true);
  }

  function openEdit(c: Categoria) {
    setEditing(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? "" });
    setModalOpen(true);
  }

  function close() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { nome: form.nome, descricao: form.descricao || undefined };

    if (editing) {
      const ok = await update.executar(
        `/api/categorias/${editing.id}`,
        body,
      );
      if (ok) close();
    } else {
      const ok = await create.executar("/api/categorias", body);
      if (ok) close();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await remove.executar(`/api/categorias/${id}`);
  }

  const mutating = create.carregando || update.carregando;
  const mutationError = create.erro || update.erro || remove.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Category List"
        onAdd={openCreate}
        addLabel="New Category"
      />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRow cols={4} />
          ) : error ? (
            <EmptyRow cols={4} message={`Error loading: ${error}`} />
          ) : categories.length === 0 ? (
            <EmptyRow cols={4} message="No categories registered yet." />
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
                    <ActionButton variant="edit" onClick={() => openEdit(c)}>
                      ✏️ Edit
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
        open={modalOpen}
        title={editing ? "Edit Category" : "New Category"}
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutating}
        error={mutationError}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Category name"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Optional description"
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
  const { data, loading: loading, error: error } = useListBrands();
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const remove = useDeleteBrand();
  const approve = useApproveBrand();

  const brands = data?.marcas ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", usuarioId: "" });

  function openCreate() {
    setEditing(null);
    setForm({ nome: "", descricao: "", usuarioId: "" });
    setModalOpen(true);
  }

  function openEdit(m: Marca) {
    setEditing(m);
    setForm({
      nome: m.nome,
      descricao: m.descricao ?? "",
      usuarioId: String(m.usuarioId),
    });
    setModalOpen(true);
  }

  function close() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editing) {
      const body = { nome: form.nome, descricao: form.descricao || undefined };
      const ok = await update.executar(`/api/marcas/${editing.id}`, body);
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
    if (!confirm("Are you sure you want to delete this brand?")) return;
    await remove.executar(`/api/marcas/${id}`);
  }

  async function handleApprove(id: number) {
    await approve.executar(`/api/marcas/${id}/aprovar`);
  }

  const mutating = create.carregando || update.carregando;
  const mutationError =
    create.erro || update.erro || remove.erro || approve.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Brand List"
        onAdd={openCreate}
        addLabel="New Brand"
      />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Description</Th>
            <Th>Owner</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRow cols={6} />
          ) : error ? (
            <EmptyRow cols={6} message={`Error loading: ${error}`} />
          ) : brands.length === 0 ? (
            <EmptyRow cols={6} message="No brands registered yet." />
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
                      {m.usuario?.nome || "User not set"}
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
                    <ActionButton variant="edit" onClick={() => openEdit(m)}>
                      ✏️ Edit
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
        open={modalOpen}
        title={editing ? "Edit Brand" : "New Brand"}
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutating}
        error={mutationError}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Brand name"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Optional description"
            className={inputCls}
          />
        </Field>
        {!editing && (
          <Field label="Owner User ID">
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
  const { data, loading: loading, error: error } = useListCertificates();
  const create = useCreateCertificate();
  const update = useUpdateCertificate();
  const remove = useDeleteCertificate();

  const certificates = data?.certificados ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Certificado | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    orgaoEmissor: "",
  });

  function openCreate() {
    setEditing(null);
    setForm({ nome: "", descricao: "", orgaoEmissor: "" });
    setModalOpen(true);
  }

  function openEdit(c: Certificado) {
    setEditing(c);
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? "",
      orgaoEmissor: c.orgaoEmissor,
    });
    setModalOpen(true);
  }

  function close() {
    setModalOpen(false);
    setEditing(null);
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

    if (editing) {
      const ok = await update.executar(
        `/api/certificados/${editing.id}`,
        body,
      );
      if (ok) close();
    } else {
      const ok = await create.executar("/api/certificados", body);
      if (ok) close();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    await remove.executar(`/api/certificados/${id}`);
  }

  const mutating = create.carregando || update.carregando;
  const mutationError = create.erro || update.erro || remove.erro;

  return (
    <section className="animate-[fadeIn_0.4s_ease]">
      {mutationError && <ErrorMessage message={mutationError} />}
      <SectionHeader
        title="Certificate List"
        onAdd={openCreate}
        addLabel="New Certificate"
      />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Nome</Th>
            <Th>Issuing Body</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRow cols={5} />
          ) : error ? (
            <EmptyRow cols={5} message={`Error loading: ${error}`} />
          ) : certificates.length === 0 ? (
            <EmptyRow cols={5} message="No certificates registered yet." />
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
                    <ActionButton variant="edit" onClick={() => openEdit(c)}>
                      ✏️ Edit
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
        open={modalOpen}
        title={editing ? "Edit Certificate" : "New Certificate"}
        onClose={close}
        onSubmit={handleSubmit}
        loading={mutating}
        error={mutationError}
      >
        <Field label="Nome">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Certificate name"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Issuing Body">
          <input
            name="orgaoEmissor"
            value={form.orgaoEmissor}
            onChange={handleChange}
            placeholder="Ex: INMETRO, IBD..."
            required
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Optional description"
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
  const styles: Record<Marca["status"], string> = {
    PENDENTE: "bg-amber-50 text-amber-700",
    APROVADA: "bg-emerald-50 text-emerald-700",
    REJEITADA: "bg-red-50 text-red-600",
  };
  const labels: Record<Marca["status"], string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    REJEITADA: "Rejeitada",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)]">
          <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
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
                  {loading ? "Salvando..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-hover)]"
                >
                  Cancel
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

export default DashboardPage;
