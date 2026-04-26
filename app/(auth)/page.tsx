"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    isShop: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Simulated auth
      setTimeout(() => {
        const userData = {
          nome: formData.name || formData.email.split("@")[0],
          email: formData.email,
          tipo: formData.isShop ? "LOJA" : "CLIENTE",
        };

        sessionStorage.setItem("ecoShopUser", JSON.stringify(userData));
        localStorage.setItem("ecoShopUser", JSON.stringify(userData));

        setMessage({
          type: "success",
          text: isLogin
            ? "Login realizado com sucesso!"
            : "Conta criada com sucesso!",
        });

        setTimeout(() => {
          router.push("/");
        }, 1500);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao processar sua solicitação. Tente novamente.",
      });
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🌿</span>
            <span
              className="text-2xl font-extrabold bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
              }}
            >
              EcoShop
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-[#1a3a2e] mb-2">
            {isLogin ? "Bem-vindo de Volta" : "Junte-se a nós"}
          </h1>
          <p className="text-[#5a7a6f]">
            {isLogin
              ? "Faça login para continuar sua jornada sustentável"
              : "Crie sua conta e comece a comprar com propósito"}
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#e3ede8] rounded-2xl p-8 space-y-6"
        >
          {/* Name (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-[#1a3a2e] mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1a3a2e] mb-2">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1a3a2e] mb-2">
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors"
            />
          </div>

          {/* Phone (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-[#1a3a2e] mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 9999-9999"
                className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors"
              />
            </div>
          )}

          {/* Shop Checkbox (Register only) */}
          {!isLogin && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isShop"
                checked={formData.isShop}
                onChange={handleChange}
                className="w-4 h-4 accent-[#2d9569]"
              />
              <span className="text-sm text-[#5a7a6f]">
                Sou uma loja parceira da EcoShop
              </span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d9569] hover:bg-[#237852] disabled:bg-gray-400 text-white font-semibold py-3 rounded-full transition-all duration-200"
            style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
          >
            {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
          </button>

          {/* Toggle Auth Mode */}
          <div className="text-center text-sm text-[#5a7a6f]">
            {isLogin ? "Não tem conta? " : "Já tem conta? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
                setFormData({
                  email: "",
                  password: "",
                  name: "",
                  phone: "",
                  isShop: false,
                });
              }}
              className="text-[#2d9569] font-semibold hover:underline"
            >
              {isLogin ? "Registre-se" : "Faça login"}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3 text-sm">
          {isLogin && (
            <button className="text-[#2d9569] hover:underline font-semibold block w-full">
              Esqueceu sua senha?
            </button>
          )}
          <Link href="/" className="text-[#5a7a6f] hover:text-[#2d9569] block">
            Voltar para Início
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-[#e3ede8] flex items-center justify-center gap-4 text-xs text-[#8fa89e]">
          <span>🔒 Seguro</span>
          <span>•</span>
          <span>✓ Verificado</span>
          <span>•</span>
          <span>🌿 Sustentável</span>
        </div>
      </div>
    </main>
  );
}
