// app/(sobre)/about/page.tsx

"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    titulo: "Visão & Banco de Dados",
    itens: [
      "Definição do problema e público-alvo",
      "Modelagem relacional (Peter Chen + Pé de Galinha)",
      "Schema PostgreSQL completo",
      "Recursos inteligentes planejados",
    ],
  },
  {
    num: "02",
    titulo: "Requisitos & Front-end",
    itens: [
      "13 requisitos funcionais documentados",
      "DER conceitual e modelo lógico",
      "Scripts SQL de criação",
      "Protótipos de todas as telas",
    ],
  },
  {
    num: "03",
    titulo: "Back-end & IA",
    itens: [
      "API REST com Java + Spark Framework",
      "Arquitetura Controller → Service → DAO",
      "Azure Custom Vision integrado",
      "Gemini 2.0 Flash para análise textual",
    ],
  },
  {
    num: "04",
    titulo: "Projeto Completo",
    itens: [
      "Documentação final consolidada",
      "Deploy na plataforma Render",
      "Segurança: BCrypt + Prepared Statements",
      "Finalista entre os melhores trabalhos 2025/2",
    ],
  },
] as const;

const MELHORIAS = [
  {
    icon: "⚡",
    titulo: "Performance",
    desc: "Server Components do Next.js eliminam round-trips desnecessários. SSR e SSG onde cada um faz mais sentido.",
  },
  {
    icon: "🏗️",
    titulo: "Arquitetura Unificada",
    desc: "Frontend e backend no mesmo repo com API Routes. Prisma substitui os DAOs manuais em Java com type-safety total.",
  },
  {
    icon: "🎨",
    titulo: "Design System",
    desc: "Interface redesenhada com Syne + Plus Jakarta Sans, CSS custom properties e dark mode nativo.",
  },
  {
    icon: "🔐",
    titulo: "Autenticação",
    desc: "JWT com refresh automático, cookies httpOnly e diferenciação de roles CLIENTE / ADMIN / LOJA.",
  },
  {
    icon: "🤖",
    titulo: "IA Aprimorada",
    desc: "Integração direta via SDK oficial do Gemini. Prompts otimizados para análise de sustentabilidade.",
  },
  {
    icon: "🚀",
    titulo: "Deploy Moderno",
    desc: "Vercel com CI/CD integrado, preview deployments automáticos e CDN global sem configuração.",
  },
] as const;

const STATS = [
  { valor: "4", label: "Sprints" },
  { valor: "4", label: "Integrantes" },
  { valor: "13+", label: "Endpoints REST" },
  { valor: "2", label: "Modelos de IA" },
] as const;

export default function AboutPage() {
  useScrollReveal();

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      <section
        className="
          py-24 md:py-32
          [background-image:radial-gradient(circle_at_10%_20%,rgba(45,149,105,0.07)_0%,transparent_30%),radial-gradient(circle_at_90%_80%,rgba(45,149,105,0.05)_0%,transparent_30%)]
        "
      >
        <div className="container-eco">
          <div className="max-w-3xl flex flex-col gap-6">
            <span className="badge-eco w-fit">🏫 PUC Minas · TI2 · 2025/2</span>

            <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
              Sobre o <span className="text-gradient-eco">EcoShop</span>
            </h1>

            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Projeto acadêmico finalista do Trabalho Interdisciplinar 2 da PUC
              Minas — originalmente desenvolvido em equipe com Java e Spark
              Framework, depois completamente refatorado para Next.js.
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

      <section className="bg-[linear-gradient(135deg,#1a3a2e_0%,#0f2419_100%)] py-16">
        <div className="container-eco">
          <div
            className="
              animate-on-scroll
              flex flex-col lg:flex-row items-center justify-between gap-10
              p-10 rounded-3xl border border-white/10 relative overflow-hidden
            "
          >
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,#f59e0b_0%,transparent_60%)]" />

            <div className="relative z-10 flex flex-col gap-6 lg:w-1/2">
              <div className="flex flex-col gap-3 text-white">
                <span
                  className="
                    inline-flex items-center gap-2 w-fit
                    px-4 py-1.5 rounded-full text-sm font-bold
                    border border-[#c9a84c]/30 bg-[#c9a84c]/15 text-[#c9a84c]
                  "
                >
                  🏆 Reconhecimento Acadêmico
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white">
                  Finalista entre os melhores
                  <br className="hidden md:block" /> trabalhos de 2025/2
                </h2>
                <p className="text-white/70 max-w-lg">
                  O EcoShop foi selecionado como finalista na competição de
                  melhores projetos do segundo semestre na PUC Minas,
                  concorrendo com trabalhos de todas as unidades e turmas de
                  TI2.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-start">
                {["PUC Minas", "2025/2", "Grupo 10", "Sustentabilidade"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="
                        px-4 py-2 rounded-full text-sm font-semibold
                        border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]
                      "
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
                alt="Palco da Premiação Melhores TCCs e TIs na PUC Minas"
                className="
                  w-full h-auto object-cover 
                  rounded-2xl border border-white/10 
                  shadow-[0_0_30px_rgba(201,168,76,0.15)]
                  transition-transform duration-500 hover:scale-[1.02]
                "
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="animate-on-scroll flex flex-col gap-5">
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                O Problema
              </span>
              <h2 className="font-display text-4xl font-extrabold">
                Por que o EcoShop existe?
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Consumidores interessados em práticas sustentáveis enfrentam
                dificuldades para descobrir e comparar produtos com{" "}
                <strong className="text-[var(--color-text-primary)]">
                  critérios ecológicos claros e confiáveis
                </strong>
                . Não existia uma plataforma centralizada que organizasse
                produtos de diferentes marcas com informações transparentes
                sobre impacto ambiental.
              </p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                O EcoShop foi desenvolvido durante o{" "}
                <strong className="text-[var(--color-text-primary)]">
                  Trabalho Interdisciplinar 2 (TI2)
                </strong>{" "}
                da PUC Minas — disciplina que integra banco de dados, engenharia
                de software e desenvolvimento web — pelo Grupo 10.
              </p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                A plataforma contribui com o{" "}
                <strong className="text-[var(--color-text-primary)]">
                  ODS 13 (Ação Climática)
                </strong>{" "}
                e{" "}
                <strong className="text-[var(--color-text-primary)]">
                  ODS 15 (Vida Terrestre)
                </strong>{" "}
                das metas da ONU, incentivando consumo consciente e preservação
                de ecossistemas.
              </p>
            </div>

            <div className="animate-on-scroll grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: "📦",
                  titulo: "Catálogo Exclusivo",
                  desc: "Apenas produtos com critérios ecológicos verificados.",
                },
                {
                  icon: "📜",
                  titulo: "Certificações",
                  desc: "ECOCERT, FSC, Cradle to Cradle e outras.",
                },
                {
                  icon: "📚",
                  titulo: "Educação Ambiental",
                  desc: "Artigos, guias e conteúdo sobre sustentabilidade.",
                },
                {
                  icon: "🤖",
                  titulo: "IA Integrada",
                  desc: "Azure + Gemini para análise de materiais.",
                },
              ].map((card) => (
                <div
                  key={card.titulo}
                  className="
        flex flex-col gap-4 p-6 rounded-2xl
        border border-[var(--color-border)] bg-[var(--color-bg-body)]
        hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]
        transition-all duration-300
      "
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

      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Processo
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              4 sprints, 1 produto
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Do levantamento de requisitos à entrega final, cada sprint avançou
              a maturidade técnica e funcional do projeto.
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

      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Evolução Técnica
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              Da entrega ao refinamento
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Após a conclusão do projeto original, o código foi inteiramente
              refatorado de forma individual para Next.js.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            <div className="animate-on-scroll flex flex-col gap-5 p-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-body)]">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-bg-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border)] w-fit">
                Versão Original · Equipe
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
                Backend em Java com Spark Framework expondo uma REST API com
                arquitetura em camadas (Controller → Service → DAO). Frontend em
                HTML/CSS/JS vanilla. Deploy no Render com PostgreSQL.
              </p>
            </div>

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

            <div
              className="animate-on-scroll flex flex-col gap-5 p-8 rounded-3xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)]"
              style={{ transitionDelay: "120ms" }}
            >
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white w-fit">
                Versão Refatorada · Solo
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Next.js 15",
                  "TypeScript",
                  "React",
                  "Tailwind CSS",
                  "Prisma ORM",
                  "PostgreSQL",
                  "API Routes",
                  "Gemini AI",
                  "Vercel",
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
                Reescrita completa com Next.js App Router, componentes React
                tipados com TypeScript, ORM moderno via Prisma e design system
                coeso. Melhorias de performance, SEO, DX e arquitetura
                full-stack integrada.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              O que mudou
            </span>
            <h2 className="font-display text-4xl font-extrabold">
              Melhorias na refatoração
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MELHORIAS.map((m, i) => (
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

      {/* ── TEAM ── */}
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
            {TEAM.map((membro, i) => (
              <div
                key={membro.nome}
                className="
            animate-on-scroll
            flex flex-col items-center text-center gap-4 p-6 rounded-2xl
            border border-[var(--color-border)] bg-[var(--color-bg-body)]
            hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)] hover:-translate-y-1
            transition-all duration-300
          "
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="w-12 h-12 flex items-center justify-center rounded-full text-lg font-extrabold font-display bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  {membro.nome.charAt(0)}
                </span>
                <div>
                  <p className="font-bold text-sm text-[var(--color-text-primary)] leading-snug">
                    {membro.nome}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {membro.papel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {membro.linkedin && (
                    <a
                      href={membro.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label={`LinkedIn de ${membro.nome}`}
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
                  {membro.github && (
                    <a
                      href={membro.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label={`GitHub de ${membro.nome}`}
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

      <section className="py-20 bg-[var(--color-bg-body)]">
        <div className="container-eco">
          <div className="animate-on-scroll flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl bg-[var(--color-primary)] relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,white_0%,transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-2 text-white">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">
                Explore a plataforma
              </h2>
              <p className="text-white/80 max-w-md">
                Descubra produtos sustentáveis, use a EcoScan IA e acesse nosso
                conteúdo educativo — tudo em um só lugar.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 bg-white text-[var(--color-primary-dark)] font-bold rounded-full hover:-translate-y-px hover:shadow-xl transition-all"
              >
                Ver Produtos
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
