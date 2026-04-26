"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./auth.css";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "reg">("login");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [message, setMessage] = useState({ text: "", type: "neutral" as const });
  const [loading, setLoading] = useState(false);

  // DARK MODE
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") || "light") as
      | "light"
      | "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  const showMessage = (text: string, type: "success" | "error" | "neutral") => {
    setMessage({ text, type });
    if (type !== "neutral") {
      setTimeout(() => setMessage({ text: "", type: "neutral" }), 5000);
    }
  };

  // LOGIN
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("loginEmail") as string).trim();
    const senha = (formData.get("loginPassword") as string).trim();

    if (!email || !senha) {
      showMessage("Preencha todos os campos", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();

      if (res.ok && data.usuario) {
        saveSession(data.usuario);
        showMessage("Login realizado com sucesso!", "success");
        setTimeout(() => redirectUser(data.usuario.tipo), 1000);
      } else {
        showMessage(data.error || "Credenciais inválidas", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage("Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const nome = (formData.get("regName") as string).trim();
    const email = (formData.get("regEmail") as string).trim();
    const telefone = (formData.get("regPhone") as string).trim();
    const pass = (formData.get("regPass") as string).trim();
    const confirm = (formData.get("regConfirmPass") as string).trim();
    const isMarca = (formData.get("isMarca") as unknown) === "on";

    if (!nome || !email || !telefone || !pass || !confirm) {
      showMessage("Preencha todos os campos", "error");
      return;
    }

    if (pass !== confirm) {
      showMessage("As senhas não coincidem!", "error");
      return;
    }

    if (pass.length < 8) {
      showMessage("A senha deve ter pelo menos 8 caracteres.", "error");
      return;
    }

    const userData = {
      nome,
      email,
      telefone,
      senha: pass,
      tipo: isMarca ? "MARCA" : "CLIENTE",
    };

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (res.ok && data.usuario) {
        saveSession(data.usuario);
        showMessage("Conta criada! Redirecionando...", "success");
        setTimeout(() => {
          redirectUser(data.usuario.tipo);
        }, 1500);
      } else {
        showMessage(data.error || "Erro ao cadastrar.", "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showMessage("Erro ao conectar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (user: { id: number; email: string; nome: string; tipo: string }) => {
    const role = (user.tipo || "CLIENTE").toUpperCase();
    const sessionUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: role,
      tipo: role,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem("ecoShopUser", JSON.stringify(sessionUser));
  };

  const redirectUser = (tipo: string) => {
    const role = (tipo || "CLIENTE").toUpperCase();
    if (role === "ADMIN") {
      router.push("/admin/painel");
    } else if (role === "MARCA") {
      router.push("/store");
    } else {
      router.push("/");
    }
  };

  const maskPhone = (value: string): string => {
    let masked = value.replace(/\D/g, "");
    if (masked.length > 11) masked = masked.slice(0, 11);
    if (masked.length > 2)
      masked = `(${masked.slice(0, 2)}) ${masked.slice(2)}`;
    if (masked.length > 9) masked = `${masked.slice(0, 9)}-${masked.slice(9)}`;
    return masked;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = maskPhone(e.target.value);
  };

  return (
    <div className="main-wrapper">
      <Link href="/" className="floating-back-link" title="Voltar ao Início">
        <i className="fas fa-arrow-left"></i>
      </Link>

      <div className="login-container fade-in">
        <button
          className="card-theme-toggle"
          onClick={toggleTheme}
          title="Alternar Tema"
          type="button"
        >
          <i className={`fas ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
        </button>

        <div className="login-header">
          <div className="logo-icon">
            <i className="fas fa-leaf"></i>
          </div>
          <h1 className="login-title">Bem-vindo</h1>
          <p className="login-subtitle">Acesse sua conta EcoShop</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab-button ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              setMessage({ text: "", type: "neutral" });
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={`tab-button ${activeTab === "reg" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("reg");
              setMessage({ text: "", type: "neutral" });
            }}
            type="button"
          >
            Criar Conta
          </button>
        </div>

        {message.text && (
          <div
            className={`message ${message.type}`}
            style={{ display: "block" }}
          >
            {message.text}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === "login" && (
          <div className="form-container active">
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <div className="input-group">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    name="loginEmail"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Senha</label>
                <div className="input-group">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    name="loginPassword"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Entrando..." : "Entrar"}{" "}
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === "reg" && (
          <div className="form-container active">
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Nome Completo</label>
                <div className="input-group">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    name="regName"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="input-group">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    name="regEmail"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <div className="input-group">
                  <i className="fas fa-phone"></i>
                  <input
                    type="tel"
                    name="regPhone"
                    placeholder="(00) 00000-0000"
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Senha</label>
                <div className="input-group">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    name="regPass"
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirmar Senha</label>
                <div className="input-group">
                  <i className="fas fa-check-circle"></i>
                  <input
                    type="password"
                    name="regConfirmPass"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="isMarca" />
                  <span className="checkbox-text">Sou uma Marca / Parceiro</span>
                </label>
                <p className="checkbox-help">
                  Marque se você deseja gerenciar e vender produtos.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Criando conta..." : "Criar Conta"}{" "}
                <i className="fas fa-user-plus"></i>
              </button>
            </form>
          </div>
        )}

        <div className="form-footer">
          <a href="#">Esqueceu a senha?</a>
        </div>
      </div>
    </div>
  );
}
