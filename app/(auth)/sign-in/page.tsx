// app/(auth)/sign-in/page.tsx

"use client"; // necessário para usar useState, useEffect e router no Next.js

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useRegistro } from "@/lib/hooks/useAuth";
import type { LoginBody, RegistroBody } from "@/types/api";

// modo atual da tela: determina quais campos exibir e qual API chamar
type Modo = "login" | "cadastro";

// estado unificado do formulário — campos exclusivos do cadastro ficam vazios no login
type Form = {
  nome: string;
  email: string;
  senha: string;
  senhaConfirm: string; // só usado no cadastro, para confirmar a senha antes de enviar
  telefone: string; // opcional no cadastro
  isLoja: boolean; // indica se o usuário quer cadastrar como parceiro/loja
};

// folhas flutuantes decorativas, puramente visuais
// pointer-events-none e aria-hidden garantem que não atrapalhem a acessibilidade
function Particles() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden
    >
      {[...Array(6)].map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${10 + i * 15}%`, // distribui horizontalmente pela tela
            top: `${5 + i * 12}%`, // distribui verticalmente pela tela
            fontSize: `${16 + i * 4}px`, // cada folha um pouco maior que a anterior
            opacity: 0.06 + i * 0.02, // opacidade baixa para não competir com o conteúdo
            animation: `floatLeaf ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`, // delay escalonado para as folhas não se moverem sincronizadas
          }}
        >
          🌿
        </span>
      ))}
      <style>{`
        @keyframes floatLeaf {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-18px) rotate(8deg); }
          66% { transform: translateY(-8px) rotate(-5deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinIcon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes gradientPulse {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();

  const [modo, setModo] = useState<Modo>("login");
  const [form, setForm] = useState<Form>({
    nome: "",
    email: "",
    senha: "",
    senhaConfirm: "",
    telefone: "",
    isLoja: false,
  });

  const [darkMode, setDarkMode] = useState(false);
  const [senhaErro, setSenhaErro] = useState<string | null>(null); // erro de validação local, independente da API

  const login = useLogin();
  const registro = useRegistro();

  // usa o hook do modo ativo para acessar carregando e erro de forma unificada
  const hook = modo === "login" ? login : registro;
  const erro = senhaErro || hook.erro; // erro local tem prioridade sobre o erro da API
  const carregando = hook.carregando;

  // redireciona para a home se o usuário já estiver logado
  // evita que a tela de login seja acessada desnecessariamente
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
      if (res.ok) router.replace("/");
    });
  }, [router]);

  // lê a preferência de tema salva no localStorage ao montar o componente
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  // aplica ou remove a classe "dark" no <html> e persiste a preferência sempre que mudar
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // limpa o erro de senha ao usuário começar a redigitar qualquer um dos dois campos
    if (name === "senhaConfirm" || name === "senha") setSenhaErro(null);
  }

  // aplica máscara de telefone no formato brasileiro antes de salvar no estado
  function maskPhone(value: string) {
    let v = value.replace(/\D/g, "").slice(0, 11); // remove não-dígitos e limita a 11 caracteres

    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 9) v = `${v.slice(0, 9)}-${v.slice(9)}`;

    return v;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, telefone: maskPhone(e.target.value) }));
  }

  // reseta o formulário inteiro ao trocar de modo para evitar dados residuais
  function alternarModo(novo: Modo) {
    setModo(novo);
    setForm({
      nome: "",
      email: "",
      senha: "",
      senhaConfirm: "",
      telefone: "",
      isLoja: false,
    });

    setSenhaErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSenhaErro(null);

    // recupera a URL de retorno caso o usuário tenha sido redirecionado para o login pelo middleware
    const nextUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/"
        : "/";

    if (modo === "login") {
      const body: LoginBody = { email: form.email, senha: form.senha };
      const data = await login.executar("/api/auth", body);

      if (data) router.push(nextUrl); // só redireciona se a API retornou dados (null = erro)
    } else {
      // validações locais antes de chamar a API para evitar requisições desnecessárias
      if (form.senha !== form.senhaConfirm) {
        setSenhaErro("As senhas não coincidem.");
        return;
      }
      if (form.senha.length < 8) {
        setSenhaErro("A senha deve ter pelo menos 8 caracteres.");
        return;
      }

      const body: RegistroBody = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        ...(form.telefone ? { telefone: form.telefone } : {}), // só inclui telefone se preenchido
      };

      const data = await registro.executar("/api/users", body);

      if (data) router.push("/");
    }
  }

  // classes compartilhadas por todos os inputs do formulário
  // usa CSS variables do tema para funcionar corretamente nos modos claro e escuro
  const inputCls = `
    w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium
    border-2 border-[var(--color-border)]
    bg-[var(--color-bg-surface-hover)]
    text-[var(--color-text-primary)]
    placeholder:text-[var(--color-text-tertiary)]
    focus:outline-none focus:border-[var(--color-primary)]
    focus:bg-[var(--color-bg-surface)]
    focus:ring-4 focus:ring-[var(--color-primary)]/10
    transition-all duration-200
  `;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{ background: "var(--color-bg-body)" }}
    >
      <Particles />

      {/* gradiente radial sutil nos cantos para dar profundidade ao fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(45,149,105,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(61,170,122,0.05) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      {/* botão de voltar fixo no canto — fica acima de tudo com z-50 */}
      <a
        href="/"
        className="fixed top-6 left-6 z-50 w-12 h-12 flex items-center justify-center rounded-2xl text-[var(--color-text-secondary)] transition-all duration-300 hover:-translate-x-1.5 hover:text-[var(--color-primary)]"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-md)",
        }}
        title="Voltar ao início"
      >
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </a>

      {/* card principal com animação de entrada vindo de baixo */}
      <div
        className="relative z-10 w-full max-w-[460px]"
        style={{ animation: "slideUp 0.55s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div
          className="rounded-2xl p-10 transition-all duration-300"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* cabeçalho: ícone animado + título + subtítulo */}
          <div className="text-center mb-9">
            <div
              className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center mx-auto mb-5 text-white text-3xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                boxShadow: "0 12px 32px rgba(45,149,105,0.28)",
                animation:
                  "spinIcon 3s cubic-bezier(0.45,0.05,0.55,0.95) infinite",
              }}
              aria-hidden
            >
              🌿
            </div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {modo === "login" ? "Bem-vindo" : "Criar Conta"}
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {modo === "login"
                ? "Acesse sua conta EcoShop"
                : "Junte-se à comunidade sustentável"}
            </p>
          </div>

          {/* toggle de modo: estilo de tab, sem <select> para manter o visual customizado */}
          <div
            className="grid grid-cols-2 gap-2.5 mb-8 p-2 rounded-2xl"
            style={{
              background: "var(--color-bg-surface-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            {(["login", "cadastro"] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => alternarModo(m)}
                className="py-3 rounded-xl text-sm font-semibold transition-all duration-250 relative"
                style={
                  modo === m
                    ? {
                        // aba ativa: destaque com borda e sombra leve
                        background: "var(--color-bg-surface)",
                        color: "var(--color-primary)",
                        border: "1px solid var(--color-primary-light)",
                        boxShadow: "0 2px 8px rgba(45,149,105,0.14)",
                      }
                    : {
                        // aba inativa: transparente para parecer parte do fundo
                        background: "transparent",
                        color: "var(--color-text-secondary)",
                        border: "1px solid transparent",
                      }
                }
              >
                {m === "login" ? "Login" : "Criar Conta"}
              </button>
            ))}
          </div>

          {/* exibe erro da API ou de validação local com animação de entrada */}
          {erro && (
            <div
              className="mb-5 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5"
              style={{
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
                animation: "fadeSlide 0.3s ease",
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
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {erro}
            </div>
          )}

          {/* key={modo} faz o React remontar o form ao trocar de modo, reiniciando a animação */}
          <form
            onSubmit={handleSubmit}
            style={{ animation: "fadeSlide 0.35s ease" }}
            key={modo}
          >
            <div className="flex flex-col gap-5">
              {/* campo exclusivo do cadastro */}
              {modo === "cadastro" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Nome Completo *
                  </label>
                  <div className="relative">
                    {/* ícone posicionado absolutamente dentro do input via pl-11 */}
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="nome"
                      id="nome"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Seu nome completo"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* campo compartilhado entre login e cadastro */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Email *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
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
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* campo exclusivo do cadastro, com máscara aplicada via handlePhoneChange */}
              {modo === "cadastro" && (
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
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
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
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      name="telefone"
                      id="telefone"
                      value={form.telefone}
                      onChange={handlePhoneChange} // handler separado para aplicar a máscara
                      placeholder="(00) 00000-0000"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* campo compartilhado — minLength só aplicado no cadastro */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Senha *{" "}
                  {modo === "cadastro" && (
                    <span
                      className="font-normal text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      (mín. 8 caracteres)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
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
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    name="senha"
                    id="senha"
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={modo === "cadastro" ? 8 : undefined} // validação nativa do browser só no cadastro
                    className={inputCls}
                  />
                </div>
              </div>

              {/* campo exclusivo do cadastro para confirmar a senha antes de enviar */}
              {modo === "cadastro" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
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
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      name="senhaConfirm"
                      id="senhaConfirm"
                      value={form.senhaConfirm}
                      onChange={handleChange}
                      placeholder="Repita a senha"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* checkbox de loja: o clique no container inteiro também alterna o checkbox */}
              {modo === "cadastro" && (
                <div
                  className="flex flex-col gap-2.5 p-4 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: "var(--color-bg-surface-hover)",
                    // borda muda de cor quando marcado para dar feedback visual
                    border: `1px solid ${form.isLoja ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                  onClick={() => setForm((p) => ({ ...p, isLoja: !p.isLoja }))}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isLoja"
                      checked={form.isLoja}
                      onChange={handleChange}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: "var(--color-primary)" }}
                      onClick={(e) => e.stopPropagation()} // evita duplo toggle ao clicar direto no checkbox
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Sou uma Loja / Parceiro
                    </span>
                  </label>
                  <p
                    className="text-xs pl-8"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Marque se deseja gerenciar e vender produtos.
                  </p>
                </div>
              )}

              {/* botão de submit — desabilitado enquanto a requisição está em andamento */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                  boxShadow: "0 4px 14px rgba(45,149,105,0.28)",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => {
                  if (!carregando)
                    // não aplica hover enquanto está carregando
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
              >
                {carregando ? (
                  // spinner animado enquanto aguarda resposta da API
                  <>
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Aguarde...
                  </>
                ) : modo === "login" ? (
                  <>
                    Entrar
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                ) : (
                  <>
                    Criar Conta
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* link de recuperação de senha separado do form para não submeter acidentalmente */}
          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <a
              href="#"
              className="text-sm font-semibold transition-colors duration-200 hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Esqueceu a senha?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
