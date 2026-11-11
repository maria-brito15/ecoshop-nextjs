// app/(educacao)/educacao/page.tsx

/**
 * ENVIRONMENTAL EDUCATION PAGE
 *
 * Route: "/educacao"
 *
 * EcoShop's educational page, meant to raise users' awareness
 * about sustainability, recycling and ecological practices.
 *
 * Features:
 * - Educational articles about the environment
 * - Practical recycling tips by material type
 * - Interactive quiz to test knowledge
 *
 * Topics covered:
 * - What is Ecology (producers, consumers, decomposers)
 * - Pillars of Sustainability (environmental, social, economic)
 * - Selective collection and bin colors
 * - Decomposition time of materials
 *
 * @see app/components/Header.tsx - Navigation to this page
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Tab = "artigos" | "dicas" | "quiz";

type Article = {
  tag: "verde" | "agua" | "energia" | "consumo";
  tagLabel: string;
  tagColor: string;
  icon: string;
  title: string;
  time: string;
  summary: string;
  body: string;
};

type Tip = {
  icon: string;
  title: string;
  color: string;
  tips: string[];
};

type Question = {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
};

// ----------------------------------------------------------------------------
// STATIC CONTENT
// ----------------------------------------------------------------------------

/**
 * Educational articles about sustainability.
 * Each article has a tag, icon, title, reading time and full content.
 */
const ARTICLES: Article[] = [
  {
    tag: "verde",
    tagLabel: "Meio ambiente",
    tagColor:
      "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]",
    icon: "🌿",
    title: "Why does selective collection matter?",
    time: "4 min",
    summary:
      "Correctly separating waste cuts the volume sent to landfills by up to 30% and makes the recycling chain viable.",
    body: "Selective collection is the first step toward an efficient recycling chain. When we separate waste correctly at home, we make the work of waste-picker cooperatives easier and drastically reduce the volume of waste going to landfills.\n\nStudies indicate that municipalities with active selective collection programs cut the material sent to landfills by up to 30%. This extends the lifespan of those sites and reduces emissions of methane, a highly polluting gas.\n\nThe simplest step: separate dry waste (plastic, paper, metal, glass) from wet waste (food scraps). Many municipalities offer separate collection for each type.",
  },
  {
    tag: "agua",
    tagLabel: "Water",
    tagColor: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    icon: "💧",
    title: "How to reduce water consumption at home",
    time: "3 min",
    summary:
      "Small daily habits can save hundreds of liters per month without giving up comfort.",
    body: "Conscious water use starts with small habits. Turning off the tap while brushing your teeth saves up to 12 liters per minute. In the shower, cutting just two minutes can save about 24 liters per day.\n\nBeyond habits, you can adapt the house: aerators on taps reduce flow without hurting the feeling of pressure, and dual-flush toilets save up to 60% of water per use.\n\nReusing washing machine water to clean sidewalks or water plants is another simple practice with a large cumulative impact over the month.",
  },
  {
    tag: "energia",
    tagLabel: "Energia",
    tagColor:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    icon: "⚡",
    title: "Energy efficiency: what changes in practice",
    time: "5 min",
    summary:
      "Replacing incandescent bulbs with LEDs and unplugging standby devices can cut up to 20% of the electricity bill.",
    body: "Energy efficiency is one of the most accessible ways to reduce environmental impact. LED bulbs use up to 80% less energy than incandescent ones and last much longer, which quickly pays back the initial investment.\n\nDevices in standby mode account for 5% to 12% of a household's total energy consumption. Unplugging them when not in use is a simple and effective habit.\n\nAppliances with the Procel A label are more efficient and, in the long run, cheaper.",
  },
  {
    tag: "consumo",
    tagLabel: "Consumo",
    tagColor:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    icon: "🛒",
    title: "Conscious consumption beyond the cliché",
    time: "6 min",
    summary:
      "Before buying, ask: do I need this? What happens when I throw it away? Understand the life cycle of products.",
    body: "Conscious consumption does not mean buying less in absolute terms — it means buying with more intention. Before any purchase, it is worth asking: do I need this right now? Is there a more durable alternative? What happens to this product when I throw it away?\n\nThe life cycle concept considers every stage: raw material extraction, manufacturing, transport, use and disposal.\n\nPrioritizing brands with social and environmental certifications, buying second-hand when possible and repairing before discarding are choices that, added together, make a real difference.",
  },
];

/**
 * Recycling tips by material type.
 * Each material has an icon, a color and a list of guidelines.
 */
const TIPS: Tip[] = [
  {
    icon: "♻️",
    title: "Plastic",
    color:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    tips: [
      "Rinse packaging before discarding",
      "Remove paper labels",
      "Crush it to take up less space",
      "Red selective collection bin",
    ],
  },
  {
    icon: "📄",
    title: "Papel",
    color:
      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    tips: [
      "Avoid greasy or wet paper",
      "Boxes should be flattened",
      "Toilet paper and napkins are not recyclable",
      "Blue selective collection bin",
    ],
  },
  {
    icon: "🍶",
    title: "Vidro",
    color:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
    tips: [
      "Do not mix with other materials",
      "The metal lid can go separately",
      "Broken glass: wrap it carefully",
      "Green selective collection bin",
    ],
  },
  {
    icon: "🥫",
    title: "Metal",
    color:
      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    tips: [
      "Crush cans to save space",
      "Clean off food residue",
      "Empty aerosol cans can be discarded here",
      "Yellow selective collection bin",
    ],
  },
  {
    icon: "🌱",
    title: "Organic",
    color:
      "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border-[var(--color-border)]",
    tips: [
      "Food scraps become compost",
      "Peels and coffee grounds are great for gardens",
      "Brown bin where available",
      "Avoid mixing with plastic or paper",
    ],
  },
  {
    icon: "⚠️",
    title: "Especial",
    color:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    tips: [
      "Batteries: collection points in supermarkets",
      "Medicines: pharmacies offer free disposal",
      "Electronics: take them to repair shops or manufacturers",
      "Never pour cooking oil down the sink",
    ],
  },
];

/**
 * Quiz questions about sustainability.
 * Each question has a prompt, options, the correct answer and an explanation.
 */
const QUESTIONS: Question[] = [
  {
    q: "Which bin color is used for plastic in selective collection?",
    opts: ["Azul", "Vermelha", "Verde", "Amarela"],
    ans: 1,
    exp: "The red bin is the standard color for plastics in the Brazilian selective collection system.",
  },
  {
    q: "Which gas is produced by the decomposition of organic matter in landfills?",
    opts: ["CO₂", "Ozone", "Metano", "Nitrogen"],
    ans: 2,
    exp: "Methane (CH₄) is released by anaerobic decomposition. It is a greenhouse gas far more potent than CO₂.",
  },
  {
    q: "Approximately how long does a plastic bag take to decompose?",
    opts: ["10 anos", "50 anos", "400 anos", "10.000 anos"],
    ans: 2,
    exp: "Common plastic bags take between 400 and 1,000 years to decompose completely in the environment.",
  },
  {
    q: "Which of these items is NOT recyclable in conventional selective collection?",
    opts: [
      "Aluminum can",
      "Used toilet paper",
      "Garrafa PET",
      "Jornal",
    ],
    ans: 1,
    exp: "Used toilet paper is contaminated and cannot be recycled. Cans, PET and newspapers are recyclable.",
  },
  {
    q: "How much does turning off the tap while brushing your teeth save per minute?",
    opts: ["2 litros", "6 litros", "12 litros", "20 litros"],
    ans: 2,
    exp: "An open tap uses on average 12 liters per minute. Turning it off while brushing is one of the habits with the greatest impact.",
  },
];

// ----------------------------------------------------------------------------
// HOOKS PERSONALIZADOS
// ----------------------------------------------------------------------------

/**
 * Hook for the reveal-on-scroll animation.
 * Detects when elements with the "animate-on-scroll" class enter the viewport
 * and adds the "visible" class to trigger the CSS animation.
 */
function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              observer.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1 },
      );

      document.querySelectorAll(".animate-on-scroll").forEach((el) => {
        el.classList.remove("visible");
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 50);

    return () => clearTimeout(timer);
  }, deps);
}

// ----------------------------------------------------------------------------
// TAB COMPONENTS
// ----------------------------------------------------------------------------

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "artigos", label: "Artigos", icon: "📖" },
  { id: "dicas", label: "Recycling tips", icon: "♻️" },
  { id: "quiz", label: "Quiz", icon: "🧠" },
];

/**
 * Educational articles section.
 * Shows a list of articles as cards. Clicking expands it for full reading.
 */
function ArticlesSection({
  onArtigoChange: onArticleChange,
}: {
  onArtigoChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState<Article | null>(null);

  function openArticle(article: Article) {
    setOpen(article);
    onArticleChange?.(true);
  }

  function closeArticle() {
    setOpen(null);
    onArticleChange?.(false);
  }

  // Expanded article view
  if (open) {
    return (
      <div className="animate-[fadeSlideUp_0.4s_ease]">
        <button
          onClick={closeArticle}
          className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          ← Back to articles
        </button>

        <div className="max-w-3xl">
          <span className={`badge-eco mb-4 inline-flex ${open.tagColor}`}>
            {open.icon} {open.tagLabel}
          </span>
          <p className="text-xs text-[var(--color-text-tertiary)] font-semibold uppercase tracking-wider mb-3">
            {open.time} read
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight">
            {open.title}
          </h2>
          <div className="prose max-w-none">
            {open.body.split(/\n\n+/).map((p, i) => (
              <p
                key={i}
                className="text-[var(--color-text-secondary)] leading-8 mb-5 text-base"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid de artigos
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {ARTICLES.map((article, i) => (
        <article
          key={i}
          className="card-eco flex flex-col p-7 cursor-pointer relative overflow-hidden group"
          onClick={() => openArticle(article)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-3 mb-4">
            <span className={`badge-eco text-xs ${article.tagColor}`}>
              {article.icon} {article.tagLabel}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">
              ⏱ {article.time}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-3 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
            {article.title}
          </h3>

          <p className="text-[var(--color-text-secondary)] text-sm leading-6 flex-1 mb-5">
            {article.summary}
          </p>

          <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:gap-2 flex items-center gap-1 transition-all">
            Ler artigo <span>→</span>
          </span>
        </article>
      ))}
    </div>
  );
}

/**
 * Recycling tips section.
 * Shows cards with guidance specific to each material type.
 */
function TipsSection() {
  const [selected, setSelected] = useState<Tip>(TIPS[0]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        {TIPS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelected(d)}
            className={`
              inline-flex items-center gap-2
              px-4 py-2 rounded-full text-sm font-semibold
              border transition-all duration-200
              ${
                selected.title === d.title
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--shadow-btn)]"
                  : "bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }
            `}
          >
            {d.icon} {d.title}
          </button>
        ))}
      </div>

      <div
        key={selected.title}
        className="bg-[var(--color-bg-surface)] rounded-2xl p-8 border border-[var(--color-border)] shadow-[var(--shadow-card)] animate-[fadeSlideUp_0.35s_ease]"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border ${selected.color}`}
          >
            {selected.icon}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              {selected.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Como descartar corretamente
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {selected.tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-bg-body)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm leading-6"
            >
              <span className="text-[var(--color-primary)] font-bold text-base mt-0.5 flex-shrink-0">
                ✓
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Interactive quiz section.
 * Multiple-choice questions with scoring and explanations.
 */
function QuizSection() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[index];
  const progress = (index / QUESTIONS.length) * 100;

  function answer(i: number) {
    if (choice !== null) return;
    setChoice(i);
    if (i === question.ans) setScore((s) => s + 1);
  }

  function advance() {
    if (index + 1 >= QUESTIONS.length) setFinished(true);
    else {
      setIndex((n) => n + 1);
      setChoice(null);
    }
  }

  function reset() {
    setIndex(0);
    setScore(0);
    setChoice(null);
    setFinished(false);
  }

  // Tela de resultados
  if (finished) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🌟" : "📚";
    const msg =
      pct >= 80
        ? "Congratulations! You are a sustainability expert!"
        : pct >= 60
          ? "Very good! Keep learning!"
          : "Keep studying — you will get better!";

    return (
      <div className="max-w-lg mx-auto text-center animate-[fadeSlideUp_0.4s_ease]">
        <div className="bg-[var(--color-bg-surface)] rounded-2xl p-10 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <span className="text-6xl block mb-4">{emoji}</span>
          <h3 className="font-display text-2xl font-extrabold text-[var(--color-text-primary)] mb-2">
            Quiz completed!
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-6">{msg}</p>

          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-extrabold text-[var(--color-text-primary)] leading-none">
                {pct}%
              </span>
              <span className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {score}/{QUESTIONS.length}
              </span>
            </div>
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold bg-[var(--color-primary)] text-white shadow-[var(--shadow-btn)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 transition-all"
          >
            🔄 Try again
          </button>
        </div>
      </div>
    );
  }

  // Tela de pergunta ativa
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-[var(--color-primary-dark)] to-[#0f2419] px-8 py-8 text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
            🧠 Quiz Ambiental
          </span>
          <h3 className="font-display text-2xl font-bold mb-1">
            Test your knowledge
          </h3>
          <p className="text-white/90 text-sm">
            Pergunta {index + 1} of {QUESTIONS.length}
          </p>

          <div className="mt-5 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--color-bg-surface)] p-8">
          <div className="flex items-center justify-between mb-6 text-sm">
            <span className="text-[var(--color-text-tertiary)]">Score</span>
            <span className="font-bold text-[var(--color-primary)]">
              {score} acerto{score !== 1 ? "s" : ""}
            </span>
          </div>

          <p className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-6 leading-snug">
            {question.q}
          </p>

          <div className="space-y-3 mb-6">
            {question.opts.map((opt, i) => {
              const answered = choice !== null;
              const isCorrect = i === question.ans;
              const isChosen = i === choice;

              let cls =
                "w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium text-sm transition-all duration-200 ";

              if (!answered) {
                cls +=
                  "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]";
              } else if (isCorrect) {
                cls +=
                  "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
              } else if (isChosen) {
                cls +=
                  "border-red-400 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300";
              } else {
                cls +=
                  "border-[var(--color-border)] text-[var(--color-text-tertiary)] opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={answered}
                  className={cls}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${
                        !answered
                          ? "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                          : isCorrect
                            ? "border-emerald-400 bg-emerald-400 text-white"
                            : isChosen
                              ? "border-red-400 bg-red-400 text-white"
                              : "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {answered && isCorrect
                        ? "✓"
                        : answered && isChosen
                          ? "✕"
                          : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {choice !== null && (
            <div
              className={`p-4 rounded-xl text-sm mb-6 leading-6 border animate-[fadeSlideUp_0.3s_ease] ${
                choice === question.ans
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300"
                  : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300"
              }`}
            >
              <strong>
                {choice === question.ans ? "✅ Correto! " : "❌ Incorreto. "}
              </strong>
              {question.exp}
            </div>
          )}

          {choice !== null && (
            <button
              onClick={advance}
              className="w-full py-3.5 rounded-full text-sm font-bold bg-[var(--color-primary)] text-white shadow-[var(--shadow-btn)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 transition-all animate-[fadeSlideUp_0.3s_ease]"
            >
              {index + 1 < QUESTIONS.length
                ? "Next question →"
                : "Ver resultado →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------------

export default function EducationPage() {
  const [tab, setTab] = useState<Tab>("artigos");
  const [openArticle, setOpenArticle] = useState(false);

  useScrollReveal([tab, openArticle]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* HERO SECTION */}
      <section className="text-center py-20 md:py-28 bg-[var(--color-bg-body)] [background-image:radial-gradient(circle_at_50%_0%,rgba(45,149,105,0.08)_0%,transparent_70%)] border-b border-[var(--color-border)] mb-16">
        <div className="container-eco">
          <div className="animate-on-scroll">
            <span className="badge-eco mb-6 mx-auto">
              🎓 Learning Center
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Knowledge for <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-blue-500">
                mudar o mundo
              </span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
              Understand how your choices impact the planet and discover, step by step, how to be part of the solution.
            </p>
          </div>
        </div>
      </section>

      <div className="container-eco pb-24">
        {/* SEÇÃO: O QUE É ECOLOGIA? */}
        <section className="animate-on-scroll mb-20">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-2xl flex-shrink-0">
              🌱
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Fundamentos
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-tight">
                What is Ecology?
              </h2>
            </div>
          </div>
          <p className="text-[var(--color-text-secondary)] text-base leading-7 mb-8 max-w-3xl pl-[calc(3.5rem+1.25rem)]">
            Ecology is the science that studies the interactions between living beings and the environment. It is like a large web where everything is connected — plants, animals, air, water, soil and us.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: "🌿",
                title: "Produtores",
                desc: "Plants and algae that make their own food through photosynthesis, converting sunlight into vital energy.",
              },
              {
                icon: "🐾",
                title: "Consumidores",
                desc: "Animals that feed on other living beings. They can be herbivores, carnivores or omnivores.",
              },
              {
                icon: "♻️",
                title: "Decompositores",
                desc: "Fungi and bacteria that break down organic matter, recycling nutrients essential to the soil.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="card-eco p-7 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-3xl mb-4 text-[var(--color-primary)] opacity-80">
                  {card.icon}
                </div>
                <h4 className="font-bold text-lg text-[var(--color-text-primary)] mb-2">
                  {card.title}
                </h4>
                <p className="text-[var(--color-text-secondary)] text-sm leading-6">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white rounded-3xl p-10 text-center shadow-[var(--shadow-xl)]">
            <span className="absolute top-[-1rem] right-6 text-[12rem] leading-none text-white/[0.04] font-serif pointer-events-none select-none">
              &ldquo;
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)] mb-5">
              Conceito Fundamental
            </p>
            <blockquote className="text-2xl md:text-3xl font-semibold italic leading-snug mb-4">
              &ldquo;In nature nothing is created, nothing is lost, everything is transformed&rdquo;
            </blockquote>
            <cite className="text-white/60 text-sm not-italic">
              — Antoine Lavoisier
            </cite>
          </div>
        </section>

        {/* SEÇÃO: PILARES DA SUSTENTABILIDADE */}
        <section className="animate-on-scroll mb-20">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-2xl flex-shrink-0">
              🌍
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                Pilares
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                Sustentabilidade
              </h2>
            </div>
          </div>
          <p className="text-[var(--color-text-secondary)] text-base leading-7 mb-8 max-w-3xl pl-[calc(3.5rem+1.25rem)]">
            Sustainability means meeting the needs of the present without compromising the ability of future generations to meet their own needs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            {[
              {
                icon: "🌲",
                label: "Ambiental",
                desc: "Preservar recursos e ecossistemas",
                bg: "bg-[var(--color-primary-light)]",
                color: "text-[var(--color-primary)]",
              },
              {
                icon: "👥",
                label: "Social",
                desc: "Ensuring well-being and justice",
                bg: "bg-blue-50 dark:bg-blue-500/15",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: "🪙",
                label: "Economic",
                desc: "Viable and fair development",
                bg: "bg-amber-50 dark:bg-amber-500/15",
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 p-5 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] hover:-translate-y-0.5 hover:border-[var(--color-border-hover)] transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.bg} ${s.color}`}
                >
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-base">
                    {s.label}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-5 p-5 rounded-xl bg-amber-50/80 border border-amber-200/70 dark:bg-amber-500/10 dark:border-amber-500/20">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center text-lg flex-shrink-0">
              💡
            </div>
            <div>
              <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-1">
                Quick Tip
              </h4>
              <p className="text-amber-700/80 dark:text-amber-500 text-sm leading-6">
                Small daily actions make a difference! Start by saving water, separating waste and choosing durable products.
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO: ARTIGOS / DICAS / QUIZ (TABS) */}
        <section className="animate-on-scroll">
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {TABS.map((a) => (
              <button
                key={a.id}
                onClick={() => setTab(a.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  tab === a.id
                    ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-btn)]"
                    : "bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-[fadeSlideUp_0.35s_ease]">
            {tab === "artigos" && (
              <ArticlesSection onArtigoChange={setOpenArticle} />
            )}
            {tab === "dicas" && <TipsSection />}
            {tab === "quiz" && <QuizSection />}
          </div>
        </section>

        {/* CALL-TO-ACTION FINAL */}
        <section className="animate-on-scroll mt-20">
          <div className="text-center p-12 rounded-3xl bg-[var(--color-primary-light)] border border-dashed border-[var(--color-primary)]/50 dark:bg-[rgba(45,149,105,0.1)]">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-text-primary)] mb-3">
              Ready to act?
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
              Visit our store and discover products that help you live a more sustainable life today.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-[var(--color-primary)] text-white shadow-[0_4px_12px_rgba(45,149,105,0.3)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)] transition-all duration-200"
            >
              🛍️ See Eco-Friendly Products
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
