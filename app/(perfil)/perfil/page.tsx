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

function ImpactCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="relative flex flex-col items-center text-center p-8 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        animation: `fadeInUp 0.55s ease-out ${delay}ms both`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))",
        }}
      />
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-3xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: color }}
      >
        {icon}
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        {label}
      </h3>
      <div
        className="text-4xl font-extrabold my-2"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all duration-250 whitespace-nowrap border-b-[3px]"
      style={{
        background: "none",
        border: "none",
        borderBottom: active
          ? "3px solid var(--color-primary)"
          : "3px solid transparent",
        color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
        cursor: "pointer",
      }}
    >
      <span className="text-lg">{icon}</span>
      {children}
    </button>
  );
}

function Notification({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl text-white text-sm font-semibold shadow-2xl"
      style={{
        background: type === "success" ? "#10b981" : "#ef4444",
        animation: "slideInRight 0.3s ease",
      }}
    >
      {type === "success" ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function EditModal({
  usuario,
  form,
  onChange,
  onSave,
  onCancel,
  salvando,
  erroEdit,
}: {
  usuario: Usuario;
  form: EditForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  salvando: boolean;
  erroEdit: string | null;
}) {
  const inputCls = `
    w-full px-4 py-3 rounded-xl text-sm font-medium
    border border-[var(--color-border)]
    bg-[var(--color-bg-body)]
    text-[var(--color-text-primary)]
    placeholder:text-[var(--color-text-tertiary)]
    focus:outline-none focus:border-[var(--color-primary)]
    focus:ring-4 focus:ring-[var(--color-primary)]/10
    transition-all duration-200
  `;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: "scaleIn 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2
            className="text-xl font-extrabold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Editar Perfil
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:rotate-90 hover:bg-red-50 hover:text-red-600"
            style={{
              background: "var(--color-bg-body)",
              color: "var(--color-text-secondary)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="px-7 py-6 flex flex-col gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={onChange}
                required
                className={inputCls}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={usuario.email}
                disabled
                className={`${inputCls} opacity-50 cursor-not-allowed`}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Telefone{" "}
                <span
                  className="font-normal text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  (opcional)
                </span>
              </label>
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={onChange}
                className={inputCls}
                placeholder="(00) 00000-0000"
              />
            </div>

            {erroEdit && (
              <div
                className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erroEdit}
              </div>
            )}
          </div>

          <div
            className="flex gap-3 px-7 py-5 justify-end"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: "transparent",
                color: "var(--color-text-secondary)",
                border: "2px solid var(--color-border)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                boxShadow: "0 4px 12px rgba(45,149,105,0.3)",
              }}
            >
              {salvando ? (
                <svg
                  className="animate-spin"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<"historico" | "impacto">("historico");

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<EditForm>({ nome: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  const [notif, setNotif] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [historyCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = localStorage.getItem("ecoshop_history");
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  });

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

  function showNotif(msg: string, type: "success" | "error") {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  }

  async function handleLogout() {
    if (!confirm("Deseja realmente sair?")) return;
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
        setErroEdit(data.mensagem ?? "Erro ao salvar.");
        return;
      }
      const data = await res.json();
      setUsuario((prev) => (prev ? { ...prev, ...data.usuario } : prev));
      setEditando(false);
      showNotif("Perfil atualizado com sucesso!", "success");
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

  if (carregando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-body)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Carregando perfil...
          </p>
        </div>
      </div>
    );
  }

  if (erro || !usuario) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-body)" }}
      >
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p
            className="font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {erro ?? "Perfil não encontrado."}
          </p>
          <a
            href="/sign-in"
            className="mt-4 inline-block text-sm font-semibold hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  const memberSince = new Date(usuario.criadoEm).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
  });

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {notif && <Notification message={notif.msg} type={notif.type} />}
      {editando && (
        <EditModal
          usuario={usuario}
          form={form}
          onChange={handleChange}
          onSave={handleSalvar}
          onCancel={handleCancelar}
          salvando={salvando}
          erroEdit={erroEdit}
        />
      )}

      <main
        className="min-h-screen pb-24"
        style={{
          background:
            "linear-gradient(180deg, var(--color-bg-body) 0%, var(--color-bg-surface) 100%)",
          paddingTop: "100px",
        }}
      >
        <section
          className="mb-12"
          style={{ animation: "fadeInUp 0.6s ease-out both" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div
              className="relative overflow-hidden rounded-3xl p-12 flex flex-wrap items-center gap-10 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
                  opacity: 0.07,
                  transform: "translate(30%, -30%)",
                }}
                aria-hidden
              />

              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl relative flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  boxShadow: "0 8px 24px rgba(45,149,105,0.32)",
                  animation: "pulse 2.5s ease-in-out infinite",
                }}
              >
                👤
                <span
                  className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full"
                  style={{
                    background: "#10b981",
                    border: "3px solid var(--color-bg-surface)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h1
                  className="text-3xl font-extrabold tracking-tight mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {usuario.nome}
                </h1>
                <p
                  className="text-base mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {usuario.email}
                </p>
                {usuario.telefone && (
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {usuario.telefone}
                  </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    🌱 Iniciante Sustentável
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                    style={{
                      background: "var(--color-bg-surface-hover)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    📅 Membro desde {memberSince}
                  </span>
                  {usuario.tipo !== "CLIENTE" && (
                    <span
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(245,158,11,0.12)",
                        color: "#d97706",
                        border: "1px solid rgba(245,158,11,0.25)",
                      }}
                    >
                      🏪{" "}
                      {usuario.tipo === "LOJA"
                        ? "Loja Parceira"
                        : "Administrador"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    border: "2px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--color-primary)";
                    el.style.color = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--color-border)";
                    el.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  Preferências
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "transparent",
                    color: "#ef4444",
                    border: "2px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "#ef4444";
                    el.style.color = "white";
                    el.style.borderColor = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "transparent";
                    el.style.color = "#ef4444";
                    el.style.borderColor = "var(--color-border)";
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div
            className="flex gap-0 mb-10 overflow-x-auto"
            style={{ borderBottom: "2px solid var(--color-border)" }}
          >
            <TabBtn
              active={aba === "historico"}
              onClick={() => setAba("historico")}
              icon={
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            >
              Vistos Recentemente
            </TabBtn>
            <TabBtn
              active={aba === "impacto"}
              onClick={() => setAba("impacto")}
              icon={
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
            >
              Meu Impacto
            </TabBtn>
          </div>

          {aba === "historico" && (
            <div style={{ animation: "fadeInUp 0.4s ease both" }}>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Produtos Visitados
                </h2>
                <p
                  className="text-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Itens que você visualizou recentemente.
                </p>
              </div>

              <div
                className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "2px dashed var(--color-border)",
                }}
              >
                <span className="text-6xl mb-5 opacity-40">👁️</span>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Nada por aqui ainda
                </h3>
                <p
                  className="text-base mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Você ainda não visualizou nenhum produto.
                </p>
                <a
                  href="/produtos"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                    boxShadow: "0 4px 14px rgba(45,149,105,0.3)",
                    textDecoration: "none",
                  }}
                >
                  Começar a Explorar
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {aba === "impacto" && (
            <div style={{ animation: "fadeInUp 0.4s ease both" }}>
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Meu Impacto Ambiental
                </h2>
                <p
                  className="text-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  O seu engajamento com produtos sustentáveis.
                </p>
              </div>

              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                <ImpactCard
                  icon="🌳"
                  label="Explorador Verde"
                  value={historyCount}
                  color="linear-gradient(135deg, var(--color-primary-light), var(--color-primary))"
                  delay={100}
                />
                <ImpactCard
                  icon="💧"
                  label="Potencial de Economia"
                  value={`${historyCount * 50}L`}
                  color="linear-gradient(135deg, #bae6fd, #0ea5e9)"
                  delay={200}
                />
                <ImpactCard
                  icon="♻️"
                  label="Zero Plástico"
                  value={Math.floor(historyCount * 0.3)}
                  color="linear-gradient(135deg, #fde68a, #f59e0b)"
                  delay={300}
                />
              </div>

              <div
                className="mt-8 p-5 rounded-2xl flex items-start gap-4"
                style={{
                  background: "var(--color-primary-light)",
                  border: "1px solid rgba(45, 149, 105, 0.25)",
                }}
              >
                <span className="text-2xl flex-shrink-0">🌍</span>
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--color-primary-dark)" }}
                  >
                    Continue explorando!
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Cada produto visitado representa seu interesse em um consumo
                    mais consciente. Explore mais produtos e aumente seu impacto
                    positivo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
