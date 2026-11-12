// app/(auth)/sign-in/page.tsx

/**
 * AUTHENTICATION PAGE - LOGIN AND REGISTRATION
 *
 * Route: "/sign-in"
 *
 * Page responsible for user authentication, supporting:
 * - Login of existing users
 * - Registration of new users (CUSTOMER or BRAND)
 *
 * Features:
 * - Switching between login and registration modes
 * - Form validation (passwords match, minimum length)
 * - Phone mask (automatic formatting)
 * - Dark mode toggle
 * - Integrated rate limiting (backend)
 *
 * Login flow:
 * 1. User fills in email and password
 * 2. Submits to POST /api/auth
 * 3. Backend validates and returns an httpOnly cookie with the JWT
 * 4. Redirects to the previous page (next) or home
 *
 * Registration flow:
 * 1. User fills in name, email, password, phone
 * 2. Submits to POST /api/users
 * 3. Backend validates, creates the user, generates a token
 * 4. Redirects to home
 *
 * @see lib/hooks/useAuth.ts - Authentication hooks
 * @see app/api/auth/route.ts - Login endpoint
 * @see app/api/users/route.ts - Registration endpoint
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useRegistration } from "@/lib/hooks/useAuth";
import { localPathOrRoot } from "@/lib/http/next-url";
import { fetchSession } from "@/lib/hooks/session";
import type { LoginBody, RegistrationBody } from "@/types/api";

type Mode = "login" | "register";

type Form = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  isLoja: boolean;
  brandName: string;
};

/**
 * Decorative component with animated floating leaves.
 * Visual effect only, on the authentication page.
 */
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
            left: `${10 + i * 15}%`,
            top: `${5 + i * 12}%`,
            fontSize: `${16 + i * 4}px`,
            opacity: 0.06 + i * 0.02,
            animation: `floatLeaf ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`,
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

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    isLoja: false,
    brandName: "",
  });

  const [darkMode, setDarkMode] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingBrandMessage, setPendingBrandMessage] = useState(false);

  const login = useLogin();
  const record = useRegistration();

  const hook = mode === "login" ? login : record;
  const error = passwordError || hook.error;
  const loading = hook.loading;

  // Redirect if the user is already signed in
  useEffect(() => {
    fetchSession().then((user) => {
      if (user) router.replace("/");
    });
  }, [router]);

  // Load the dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  // Apply dark mode to the HTML
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
    if (name === "confirmPassword" || name === "password") setPasswordError(null);
  }

  /**
   * Applies the phone mask in the format (XX) XXXXX-XXXX
   */
  function maskPhone(value: string) {
    let v = value.replace(/\D/g, "").slice(0, 11);

    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 9) v = `${v.slice(0, 9)}-${v.slice(9)}`;

    return v;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, phone: maskPhone(e.target.value) }));
  }

  function toggleMode(fresh: Mode) {
    setMode(fresh);
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      isLoja: false,
      brandName: "",
    });
    setPasswordError(null);
    setPendingBrandMessage(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    const nextUrl =
      typeof window !== "undefined"
        ? localPathOrRoot(
            new URLSearchParams(window.location.search).get("next"),
          )
        : "/";

    if (mode === "login") {
      const body: LoginBody = { email: form.email, password: form.password };
      const data = await login.execute("/api/auth", body);
      if (data) router.push(nextUrl);
    } else {
      // Registration validations
      if (form.password !== form.confirmPassword) {
        setPasswordError("Passwords do not match.");
        return;
      }
      if (form.password.length < 8) {
        setPasswordError("Password must have at least 8 characters.");
        return;
      }
      if (form.isLoja && !form.brandName.trim()) {
        setPasswordError("Enter the brand name.");
        return;
      }

      const body: RegistrationBody = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.isLoja
          ? { type: "BRAND" as const, brandName: form.brandName.trim() }
          : {}),
      };

      const data = await record.execute("/api/users", body);
      if (!data) return;
      if (data.pendingBrand) {
        setPendingBrandMessage(true);
        return;
      }
      router.push("/");
    }
  }

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

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(45,149,105,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(61,170,122,0.05) 0%, transparent 50%)",
        }}
        aria-hidden
      />

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
              {mode === "login" ? "Welcome" : "Create Account"}
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {mode === "login"
                ? "Access your EcoShop account"
                : "Join the sustainable community"}
            </p>
          </div>

          {/* Toggle between Login and Registration */}
          <div
            className="grid grid-cols-2 gap-2.5 mb-8 p-2 rounded-2xl"
            style={{
              background: "var(--color-bg-surface-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMode(m)}
                className="py-3 rounded-xl text-sm font-semibold transition-all duration-250 relative"
                style={
                  mode === m
                    ? {
                        background: "var(--color-bg-surface)",
                        color: "var(--color-primary)",
                        border: "1px solid var(--color-primary-light)",
                        boxShadow: "0 2px 8px rgba(45,149,105,0.14)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--color-text-secondary)",
                        border: "1px solid transparent",
                      }
                }
              >
                {m === "login" ? "Login" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
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
              {error}
            </div>
          )}

          {pendingBrandMessage ? (
            <div
              className="px-4 py-4 rounded-xl text-sm font-medium"
              style={{
                background: "var(--color-primary-light)",
                color: "var(--color-primary-dark)",
                animation: "fadeSlide 0.3s ease",
              }}
            >
              Your registration as a partner brand is under review; for now you have customer access. We will let you know when an administrator approves it.
            </div>
          ) : (
          <form
            onSubmit={handleSubmit}
            style={{ animation: "fadeSlide 0.35s ease" }}
            key={mode}
          >
            <div className="flex flex-col gap-5">
              {/* Name field (registration only) */}
              {mode === "register" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Full Name *
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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
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
                    placeholder="you@email.com"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Phone field (registration only) */}
              {mode === "register" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Phone{" "}
                    <span
                      className="font-normal text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      (optional)
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
                      name="phone"
                      id="phone"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Password *{" "}
                  {mode === "register" && (
                    <span
                      className="font-normal text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      (min. 8 characters)
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
                    name="password"
                    id="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={mode === "register" ? 8 : undefined}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Confirm Password field (registration only) */}
              {mode === "register" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Confirm Password *
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
                      name="confirmPassword"
                      id="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat the password"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Checkbox to register as a store/partner */}
              {mode === "register" && (
                <div
                  className="flex flex-col gap-2.5 p-4 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: "var(--color-bg-surface-hover)",
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
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      I am a Store / Partner
                    </span>
                  </label>
                  <p
                    className="text-xs pl-8"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Check this if you want to manage and sell products. A brand registration stays pending until an administrator approves it.
                  </p>
                  {form.isLoja && (
                    <input
                      type="text"
                      name="brandName"
                      value={form.brandName}
                      onChange={handleChange}
                      placeholder="Brand name"
                      required
                      onClick={(e) => e.stopPropagation()}
                      className={inputCls}
                    />
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                  boxShadow: "0 4px 14px rgba(45,149,105,0.28)",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
              >
                {loading ? (
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
                    Please wait...
                  </>
                ) : mode === "login" ? (
                  <>
                    Sign in
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
                    Create Account
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
          )}

          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <a
              href="#"
              className="text-sm font-semibold transition-colors duration-200 hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
