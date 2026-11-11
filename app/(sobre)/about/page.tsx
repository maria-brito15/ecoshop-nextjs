// app/(sobre)/about/page.tsx

/**
 * ABOUT ECOSHOP PAGE
 *
 * Route: "/about"
 *
 * Institutional page telling EcoShop's story, the development team
 * and the technologies used in the project.
 *
 * Topics covered:
 * - Origin of the project (PUC Minas Interdisciplinary Work 2)
 * - Academic recognition (finalist among the best works)
 * - The problem EcoShop solves
 * - Development sprints (4 sprints)
 * - Comparison between the original version (Java) and the refactored one (Next.js)
 * - Improvements made in the refactoring
 * - The project's original team
 *
 * @see app/(store)/produtos/page.tsx - Call-to-action to products
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";

// ----------------------------------------------------------------------------
// STATIC DATA
// ----------------------------------------------------------------------------

const TEAM = [
  {
    nome: "Maria Eduarda Brito",
    papel: "Desenvolvedora",
    linkedin: "https://www.linkedin.com/in/maria-eduarda-brito-a18064358/",
    github: "https://github.com/maria-brito15",
  },
  {
    nome: "Fernando Mucci",
    papel: "Desenvolvedor",
    linkedin: "https://www.linkedin.com/in/fernando-mucci-067a40384/",
    github: "https://github.com/fernandomucci",
  },
  {
    nome: "Luisa Campanha",
    papel: "Desenvolvedora",
    linkedin: "https://www.linkedin.com/in/luisa-campanha-b54700364/",
    github: "https://github.com/LuisaCampanhaH",
  },
  {
    nome: "Julia Ceribeli",
    papel: "Desenvolvedora",
    linkedin: "https://www.linkedin.com/in/juliaceribeli/",
    github: "https://github.com/juliaceribeli",
  },
] as const;

const SPRINTS = [
  {
    num: "01",
    titulo: "Vision & Database",
    itens: [
      "Problem definition and target audience",
      "Relational modeling (Peter Chen + Crow's Foot)",
      "Schema PostgreSQL completo",
      "Recursos inteligentes planejados",
    ],
  },
  {
    num: "02",
    titulo: "Requisitos & Front-end",
    itens: [
      "13 requisitos funcionais documentados",
      "Conceptual ERD and logical model",
      "Creation SQL scripts",
      "Prototypes of all screens",
    ],
  },
  {
    num: "03",
    titulo: "Back-end & IA",
    itens: [
      "REST API with Java + Spark Framework",
      "Arquitetura Controller → Service → DAO",
      "Azure Custom Vision integrado",
      "Gemini 2.0 Flash for text analysis",
    ],
  },
  {
    num: "04",
    titulo: "Projeto Completo",
    itens: [
      "Consolidated final documentation",
      "Deploy on the Render platform",
      "Security: BCrypt + Prepared Statements",
      "Finalist among the best works of 2025/2",
    ],
  },
] as const;

const IMPROVEMENTS = [
  {
    icon: "⚡",
    titulo: "Performance",
    desc: "Next.js Server Components eliminate unnecessary round-trips. SSR and SSG where each makes the most sense.",
  },
  {
    icon: "🏗️",
    titulo: "Arquitetura Unificada",
    desc: "Frontend and backend in the same repo with API Routes. Prisma replaces the manual Java DAOs with full type safety.",
  },
  {
    icon: "🎨",
    titulo: "Design System",
    desc: "Interface redesigned with Syne + Plus Jakarta Sans, CSS custom properties and native dark mode.",
  },
  {
    icon: "🔐",
    titulo: "Authentication",
    desc: "JWT with automatic refresh, httpOnly cookies and CLIENTE / ADMIN / MARCA role differentiation.",
  },
  {
    icon: "🤖",
    titulo: "IA Aprimorada",
    desc: "Direct integration via the official Gemini SDK. Prompts optimized for sustainability analysis.",
  },
  {
    icon: "🐳",
    titulo: "Containerization",
    desc: "Multi-stage Dockerfile with a minimal production image. Docker Compose orchestrates the app, PostgreSQL and Redis with healthchecks.",
  },
  {
    icon: "🚀",
    titulo: "CI/CD Completo",
    desc: "GitHub Actions: lint, typecheck and build on every PR. A push to main publishes the image to ghcr.io and deploys via SSH to the production server.",
  },
] as const;

const STATS = [
  { valor: "4", label: "Sprints" },
  { valor: "4", label: "Integrantes" },
  { valor: "17", label: "API Routes" },
  { valor: "2", label: "AI Models" },
] as const;

// ----------------------------------------------------------------------------
// HOOKS
// ----------------------------------------------------------------------------

/**
 * Hook for the reveal-on-scroll animation.
 * Adds the "visible" class to elements with the "animate-on-scroll" class.
 */
function useScrollReveal() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 },
      );
      document.querySelectorAll(".animate-on-scroll").forEach((el) => {
        observer.observe(el);
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });
      return () => observer.disconnect();
    }, 80);
    return () => clearTimeout(timer);
  }, []);
}

// ----------------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------------

export default function AboutPage() {
  useScrollReveal();

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* HERO SECTION */}
      <section className="py-24 md:py-32 [background-image:radial-gradient(circle_at_10%_20%,rgba(45,149,105,0.07)_0%,transparent_30%),radial-gradient(circle_at_90%_80%,rgba(45,149,105,0.05)_0%,transparent_30%)]">
        <div className="container-eco">
          <div className="max-w-3xl flex flex-col gap-6">
            <span className="badge-eco w-fit">🏫 PUC Minas · TI2 · 2025/2</span>
            <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
              About <span className="text-gradient-eco">EcoShop</span>
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Academic project, finalist of PUC Minas&apos; Interdisciplinary Work 2 — originally developed by a team with Java and Spark Framework, then completely refactored to Next.js.
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-6 pt-4 border-t border-[var(--color-border)] mt-2">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <strong className="font-display text-3xl font-extrabold text-[var(--color-text-primary)]">
                    {s.valor}
                  </strong>
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIC RECOGNITION */}
      <section className="bg-[linear-gradient(135deg,#1a3a2e_0%,#0f2419_100%)] py-16">
        <div className="container-eco">
          <div className="animate-on-scroll flex flex-col lg:flex-row items-center justify-between gap-10 p-10 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,#f59e0b_0%,transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:w-1/2">
              <div className="flex flex-col gap-3 text-white">
                <span className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-sm font-bold border border-[#c9a84c]/30 bg-[#c9a84c]/15 text-[#c9a84c]">
                  🏆 Academic Recognition
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white">
                  Finalist among the best <br className="hidden md:block" />{" "}
                  works of 2025/2
                </h2>
                <p className="text-white/70 max-w-lg">
                  EcoShop was selected as a finalist in the best-projects competition of the second semester at PUC Minas, competing with works from all IT units and TI2 classes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-start">
                {["PUC Minas", "2025/2", "Grupo 10", "Sustentabilidade"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="px-4 py-2 rounded-full text-sm font-semibold border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]"
                    >
                      {chip}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="relative z-10 lg:w-1/2 w-full">
              <img
                src="/evento.png"
                alt="Stage of the Best TCCs and TIs Awards at PUC Minas"
                className="w-full h-auto object-cover rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(201,168,76,0.15)] transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="animate-on-scroll flex flex-col gap-5">
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                O Problema
              </span>
              <h2 className="font-display text-4xl font-extrabold">
                Why does EcoShop exist?
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Consumers interested in sustainable practices struggle to discover and compare products with{" "}
                <strong className="text-[var(--color-text-primary)]">
                  clear and reliable ecological criteria
                </strong>
                . There was no centralized platform that organized products from different brands with transparent information about environmental impact.
              </p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                EcoShop was developed during the{" "}
                <strong className="text-[var(--color-text-primary)]">
                  Trabalho Interdisciplinar 2 (TI2)
                </strong>{" "}
                course at PUC Minas — a subject that integrates databases, software engineering and web development — by Group 10.
              </p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                The platform contributes to the{" "}
                <strong className="text-[var(--color-text-primary)]">
                  SDG 13 (Climate Action)
                </strong>{" "}
                e{" "}
                <strong className="text-[var(--color-text-primary)]">
                  ODS 15 (Vida Terrestre)
                </strong>{" "}
                of the UN goals, encouraging conscious consumption and ecosystem preservation.
              </p>
            </div>
            <div className="animate-on-scroll grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: "📦",
                  titulo: "Exclusive Catalog",
                  desc: "Only products with verified ecological criteria.",
                },
                {
                  icon: "📜",
                  titulo: "Certifications",
                  desc: "ECOCERT, FSC, Cradle to Cradle e outras.",
                },
                {
                  icon: "📚",
                  titulo: "Environmental Education",
                  desc: "Articles, guides and content about sustainability.",
                },
                {
                  icon: "🤖",
                  titulo: "IA Integrada",
                  desc: "Azure + Gemini for material analysis.",
                },
              ].map((card) => (
                <div
                  key={card.titulo}
                  className="flex flex-col gap-4 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-body)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)] transition-all duration-300"
                >
                  <span className="w-12 h-12 flex items-center justify-center rounded-xl text-2xl bg-[var(--color-primary-light)]">
                    {card.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base md:text-lg text-[var(--color-text-primary)]">
                      {card.titulo}
                    </h3>
                    <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SPRINTS */}
      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Processo
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              4 sprints, 1 product
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              From requirements gathering to final delivery, each sprint advanced the technical and functional maturity of the project.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {SPRINTS.map((sprint, i) => (
              <div
                key={sprint.num}
                className="animate-on-scroll flex flex-col gap-4"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-display font-extrabold text-4xl text-[var(--color-primary)] opacity-30 leading-none">
                    {sprint.num}
                  </span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>
                <h3 className="font-display font-bold text-xl text-[var(--color-text-primary)]">
                  {sprint.titulo}
                </h3>
                <ul className="flex flex-col gap-2">
                  {sprint.itens.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      <span className="mt-0.5 text-[var(--color-primary)] flex-shrink-0">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNICAL EVOLUTION (JAVA vs NEXT.JS) */}
      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Technical Evolution
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              From delivery to refinement
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              After the original project was completed, the code was entirely refactored individually to Next.js.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            {/* Original version */}
            <div className="animate-on-scroll flex flex-col gap-5 p-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-body)]">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-bg-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border)] w-fit">
                Original Version · Team
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Java",
                  "Spark Framework",
                  "PostgreSQL",
                  "Vanilla JS",
                  "jBCrypt",
                  "Google Gson",
                  "Azure Custom Vision",
                  "Gemini 2.0 Flash",
                  "Render",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Java backend with Spark Framework exposing a REST API with a layered architecture (Controller → Service → DAO). Frontend in vanilla HTML/CSS/JS. Deployed on Render with PostgreSQL.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex flex-col items-center justify-center gap-2 pt-12 text-[var(--color-primary)]">
              <div className="w-px h-8 bg-[var(--color-primary)] opacity-30" />
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <div className="w-px h-8 bg-[var(--color-primary)] opacity-30" />
            </div>

            {/* Refactored version */}
            <div
              className="animate-on-scroll flex flex-col gap-5 p-8 rounded-3xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)]"
              style={{ transitionDelay: "120ms" }}
            >
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white w-fit">
                Refactored Version · Solo
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Next.js 15",
                  "TypeScript",
                  "React",
                  "Tailwind CSS",
                  "Prisma ORM",
                  "PostgreSQL",
                  "Redis",
                  "API Routes",
                  "Gemini AI",
                  "Azure Vision",
                  "Docker",
                  "GitHub Actions",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--color-primary-dark)] leading-relaxed">
                Full rewrite with Next.js App Router, React components typed with TypeScript, a modern ORM via Prisma and a cohesive design system. CI/CD with GitHub Actions, Docker image published to ghcr.io and automated deploy via SSH to the production server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IMPROVEMENTS */}
      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              What changed
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              Refactoring improvements
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMPROVEMENTS.map((m, i) => (
              <div
                key={m.titulo}
                className="card-eco animate-on-scroll p-6 flex flex-col gap-3"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="w-11 h-11 flex items-center justify-center rounded-xl text-2xl bg-[var(--color-primary-light)]">
                  {m.icon}
                </span>
                <h3 className="font-display font-bold text-[var(--color-text-primary)]">
                  {m.titulo}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Grupo 10
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              Equipe original
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {TEAM.map((member, i) => (
              <div
                key={member.nome}
                className="animate-on-scroll flex flex-col items-center text-center gap-4 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-body)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="w-12 h-12 flex items-center justify-center rounded-full text-lg font-extrabold font-display bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  {member.nome.charAt(0)}
                </span>
                <div>
                  <p className="font-bold text-sm text-[var(--color-text-primary)] leading-snug">
                    {member.nome}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {member.papel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label={`${member.nome}'s LinkedIn`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label={`${member.nome}'s GitHub`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[var(--color-text-tertiary)]">
            Orientadores:{" "}
            <strong className="text-[var(--color-text-secondary)]">
              Prof.ª Amália Soares Vieira de Vasconcelos
            </strong>{" "}
            &amp;{" "}
            <strong className="text-[var(--color-text-secondary)]">
              Prof. Rommel Vieira Carneiro
            </strong>
          </p>
        </div>
      </section>

      {/* FINAL CALL-TO-ACTION */}
      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="animate-on-scroll flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl bg-[var(--color-primary)] relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,white_0%,transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-2 text-white">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">
                Explore a plataforma
              </h2>
              <p className="text-white/80 max-w-md">
                Discover sustainable products, use EcoScan AI and access our educational content — all in one place.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 bg-white text-[var(--color-primary-dark)] font-bold rounded-full hover:-translate-y-px hover:shadow-xl transition-all"
              >
                See Products
              </Link>
              <Link
                href="/ia-scan"
                className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 bg-white/20 text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 hover:-translate-y-px transition-all"
              >
                🔍 EcoScan IA
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

