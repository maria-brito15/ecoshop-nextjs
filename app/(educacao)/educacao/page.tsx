// app/(educacao)/educacao/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Aba = "artigos" | "dicas" | "quiz";

type Artigo = {
  tag: "verde" | "agua" | "energia" | "consumo";
  tagLabel: string;
  tagColor: string;
  icon: string;
  title: string;
  time: string;
  summary: string;
  body: string;
};

type Dica = {
  icon: string;
  title: string;
  color: string;
  tips: string[];
};

type Questao = {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
};

const ARTIGOS: Artigo[] = [
  {
    tag: "verde",
    tagLabel: "Meio ambiente",
    tagColor:
      "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]",
    icon: "🌿",
    title: "Por que a coleta seletiva importa?",
    time: "4 min",
    summary:
      "A separação correta do lixo reduz em até 30% o volume enviado aos aterros sanitários e viabiliza a cadeia de reciclagem.",
    body: "A coleta seletiva é o primeiro passo para uma cadeia de reciclagem eficiente. Quando separamos o lixo corretamente em casa, facilitamos o trabalho das cooperativas de catadores e reduzimos drasticamente o volume de resíduos que vai para aterros sanitários.\n\nEstudos indicam que municípios com programas ativos de coleta seletiva reduzem em até 30% o material destinado a aterros. Isso prolonga a vida útil desses espaços e diminui a emissão de metano, gás altamente poluente.\n\nO passo mais simples: separe lixo seco (plástico, papel, metal, vidro) do lixo úmido (restos de comida). Muitos municípios oferecem coleta diferenciada para cada tipo.",
  },
  {
    tag: "agua",
    tagLabel: "Água",
    tagColor: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    icon: "💧",
    title: "Como reduzir o consumo de água em casa",
    time: "3 min",
    summary:
      "Pequenos hábitos diários podem economizar centenas de litros por mês sem abrir mão do conforto.",
    body: "O consumo consciente de água começa nos pequenos hábitos. Fechar a torneira ao escovar os dentes economiza até 12 litros por minuto. No banho, reduzir o tempo em apenas dois minutos pode poupar cerca de 24 litros por dia.\n\nAlém dos hábitos, é possível adaptar a casa: arejadores nas torneiras reduzem o fluxo sem prejudicar a sensação de pressão, e descargas com acionamento duplo economizam até 60% de água por uso.\n\nReutilizar a água da máquina de lavar para limpar calçadas ou regar plantas é outra prática simples com grande impacto acumulado ao longo do mês.",
  },
  {
    tag: "energia",
    tagLabel: "Energia",
    tagColor:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    icon: "⚡",
    title: "Eficiência energética: o que muda na prática",
    time: "5 min",
    summary:
      "Trocar lâmpadas incandescentes por LED e desligar aparelhos em standby pode reduzir até 20% da conta de luz.",
    body: "A eficiência energética é uma das formas mais acessíveis de reduzir o impacto ambiental. Lâmpadas LED consomem até 80% menos energia do que as incandescentes e duram muito mais tempo, o que compensa rapidamente o investimento inicial.\n\nAparelhos em modo standby representam de 5% a 12% do consumo total de energia de uma residência. Desligá-los da tomada quando não estão em uso é um hábito simples e eficaz.\n\nEletrodomésticos com o selo Procel A são mais eficientes e, no longo prazo, mais econômicos.",
  },
  {
    tag: "consumo",
    tagLabel: "Consumo",
    tagColor:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    icon: "🛒",
    title: "Consumo consciente além do clichê",
    time: "6 min",
    summary:
      "Antes de comprar, pergunte: preciso disso? O que acontece quando descarto? Entenda o ciclo de vida dos produtos.",
    body: "Consumo consciente não significa comprar menos de forma absoluta — significa comprar com mais intenção. Antes de qualquer compra, vale perguntar: preciso disso agora? Existe uma alternativa mais durável? O que acontece com esse produto quando eu descartar?\n\nO conceito de ciclo de vida considera todas as etapas: extração de matéria-prima, fabricação, transporte, uso e descarte.\n\nPriorizar marcas com certificações socioambientais, comprar usado quando possível e reparar antes de descartar são escolhas que, somadas, criam uma diferença real.",
  },
];

const DICAS: Dica[] = [
  {
    icon: "♻️",
    title: "Plástico",
    color:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    tips: [
      "Enxágue embalagens antes de descartar",
      "Retire rótulos de papel",
      "Amasse para ocupar menos espaço",
      "Lixeira vermelha da coleta seletiva",
    ],
  },
  {
    icon: "📄",
    title: "Papel",
    color:
      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    tips: [
      "Evite papéis engordurados ou molhados",
      "Caixas devem ser desmontadas",
      "Papel higiênico e guardanapo não são recicláveis",
      "Lixeira azul da coleta seletiva",
    ],
  },
  {
    icon: "🍶",
    title: "Vidro",
    color:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
    tips: [
      "Não misture com outros materiais",
      "Tampa de metal pode ir separada",
      "Vidro quebrado: embale com cuidado",
      "Lixeira verde da coleta seletiva",
    ],
  },
  {
    icon: "🥫",
    title: "Metal",
    color:
      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    tips: [
      "Amasse latas para economizar espaço",
      "Limpe resíduos de alimentos",
      "Aerossóis vazios podem ser descartados aqui",
      "Lixeira amarela da coleta seletiva",
    ],
  },
  {
    icon: "🌱",
    title: "Orgânico",
    color:
      "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border-[var(--color-border)]",
    tips: [
      "Restos de comida viram composto",
      "Cascas e borra de café são ótimos para hortas",
      "Lixeira marrom onde disponível",
      "Evite misturar com plástico ou papel",
    ],
  },
  {
    icon: "⚠️",
    title: "Especial",
    color:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    tips: [
      "Pilhas e baterias: pontos de coleta em supermercados",
      "Medicamentos: farmácias têm descarte gratuito",
      "Eletrônicos: leve a assistências técnicas ou fabricantes",
      "Nunca jogue óleo de cozinha na pia",
    ],
  },
];

const QUESTOES: Questao[] = [
  {
    q: "Qual cor de lixeira é usada para plástico na coleta seletiva?",
    opts: ["Azul", "Vermelha", "Verde", "Amarela"],
    ans: 1,
    exp: "A lixeira vermelha é padronizada para plásticos no sistema de coleta seletiva brasileiro.",
  },
  {
    q: "Qual gás é produzido pela decomposição de matéria orgânica em aterros sanitários?",
    opts: ["CO₂", "Ozônio", "Metano", "Nitrogênio"],
    ans: 2,
    exp: "O metano (CH₄) é liberado na decomposição anaeróbica. É um gás de efeito estufa muito mais potente que o CO₂.",
  },
  {
    q: "Quanto tempo leva aproximadamente para uma sacola plástica se decompor?",
    opts: ["10 anos", "50 anos", "400 anos", "10.000 anos"],
    ans: 2,
    exp: "Sacolas plásticas comuns levam entre 400 e 1.000 anos para se decompor completamente no ambiente.",
  },
  {
    q: "Qual destes itens NÃO é reciclável na coleta seletiva convencional?",
    opts: [
      "Lata de alumínio",
      "Papel higiênico usado",
      "Garrafa PET",
      "Jornal",
    ],
    ans: 1,
    exp: "Papel higiênico usado está contaminado e não pode ser reciclado. Latas, PET e jornais são recicláveis.",
  },
  {
    q: "Fechar a torneira ao escovar os dentes economiza quanto por minuto?",
    opts: ["2 litros", "6 litros", "12 litros", "20 litros"],
    ans: 2,
    exp: "Uma torneira aberta gasta em média 12 litros por minuto. Fechar durante a escovação é um dos hábitos de maior impacto.",
  },
];

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

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "artigos", label: "Artigos", icon: "📖" },
  { id: "dicas", label: "Dicas de reciclagem", icon: "♻️" },
  { id: "quiz", label: "Quiz", icon: "🧠" },
];

function SecaoArtigos({
  onArtigoChange,
}: {
  onArtigoChange?: (aberto: boolean) => void;
}) {
  const [aberto, setAberto] = useState<Artigo | null>(null);

  function abrirArtigo(artigo: Artigo) {
    setAberto(artigo);
    onArtigoChange?.(true);
  }

  function fecharArtigo() {
    setAberto(null);
    onArtigoChange?.(false);
  }

  if (aberto) {
    return (
      <div className="animate-[fadeSlideUp_0.4s_ease]">
        <button
          onClick={fecharArtigo}
          className="
            inline-flex items-center gap-2 mb-8
            text-sm font-semibold text-[var(--color-text-secondary)]
            hover:text-[var(--color-primary)]
            transition-colors
          "
        >
          ← Voltar para artigos
        </button>

        <div className="max-w-3xl">
          <span className={`badge-eco mb-4 inline-flex ${aberto.tagColor}`}>
            {aberto.icon} {aberto.tagLabel}
          </span>
          <p className="text-xs text-[var(--color-text-tertiary)] font-semibold uppercase tracking-wider mb-3">
            {aberto.time} de leitura
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight">
            {aberto.title}
          </h2>
          <div className="prose max-w-none">
            {aberto.body.split(/\n\n+/).map((p, i) => (
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {ARTIGOS.map((artigo, i) => (
        <article
          key={i}
          className="
            card-eco
            flex flex-col
            p-7 cursor-pointer
            relative overflow-hidden
            group
          "
          onClick={() => abrirArtigo(artigo)}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-3 mb-4">
            <span className={`badge-eco text-xs ${artigo.tagColor}`}>
              {artigo.icon} {artigo.tagLabel}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">
              ⏱ {artigo.time}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-3 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
            {artigo.title}
          </h3>

          <p className="text-[var(--color-text-secondary)] text-sm leading-6 flex-1 mb-5">
            {artigo.summary}
          </p>

          <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:gap-2 flex items-center gap-1 transition-all">
            Ler artigo <span>→</span>
          </span>
        </article>
      ))}
    </div>
  );
}

function SecaoDicas() {
  const [selecionada, setSelecionada] = useState<Dica>(DICAS[0]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        {DICAS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelecionada(d)}
            className={`
              inline-flex items-center gap-2
              px-4 py-2 rounded-full text-sm font-semibold
              border transition-all duration-200
              ${
                selecionada.title === d.title
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
        key={selecionada.title}
        className="
          bg-[var(--color-bg-surface)]
          rounded-2xl p-8
          border border-[var(--color-border)]
          shadow-[var(--shadow-card)]
          animate-[fadeSlideUp_0.35s_ease]
        "
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              text-2xl border ${selecionada.color}
            `}
          >
            {selecionada.icon}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              {selecionada.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Como descartar corretamente
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {selecionada.tips.map((tip, i) => (
            <li
              key={i}
              className="
                flex items-start gap-3 p-3 rounded-xl
                bg-[var(--color-bg-body)]
                border border-[var(--color-border)]
                text-[var(--color-text-secondary)] text-sm leading-6
              "
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

function SecaoQuiz() {
  const [indice, setIndice] = useState(0);
  const [score, setScore] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  const questao = QUESTOES[indice];
  const progresso = (indice / QUESTOES.length) * 100;

  function responder(i: number) {
    if (escolha !== null) return;
    setEscolha(i);
    if (i === questao.ans) setScore((s) => s + 1);
  }

  function avancar() {
    if (indice + 1 >= QUESTOES.length) setFinalizado(true);
    else {
      setIndice((n) => n + 1);
      setEscolha(null);
    }
  }

  function reiniciar() {
    setIndice(0);
    setScore(0);
    setEscolha(null);
    setFinalizado(false);
  }

  if (finalizado) {
    const pct = Math.round((score / QUESTOES.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "🌟" : "📚";
    const msg =
      pct >= 80
        ? "Parabéns! Você é um expert em sustentabilidade!"
        : pct >= 60
          ? "Muito bom! Continue aprendendo!"
          : "Continue estudando — você vai melhorar!";

    return (
      <div className="max-w-lg mx-auto text-center animate-[fadeSlideUp_0.4s_ease]">
        <div
          className="
            bg-[var(--color-bg-surface)]
            rounded-2xl p-10
            border border-[var(--color-border)]
            shadow-[var(--shadow-card)]
          "
        >
          <span className="text-6xl block mb-4">{emoji}</span>
          <h3 className="font-display text-2xl font-extrabold text-[var(--color-text-primary)] mb-2">
            Quiz concluído!
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
                {score}/{QUESTOES.length}
              </span>
            </div>
          </div>

          <button
            onClick={reiniciar}
            className="
              inline-flex items-center gap-2
              px-8 py-3.5 rounded-full text-sm font-bold
              bg-[var(--color-primary)] text-white
              shadow-[var(--shadow-btn)]
              hover:bg-[var(--color-primary-hover)]
              hover:-translate-y-0.5
              transition-all
            "
          >
            🔄 Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="
          rounded-2xl overflow-hidden
          border border-[var(--color-border)]
          shadow-[var(--shadow-card)]
        "
      >
        <div className="bg-gradient-to-br from-[var(--color-primary-dark)] to-[#0f2419] px-8 py-8 text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
            🧠 Quiz Ambiental
          </span>
          <h3 className="font-display text-2xl font-bold mb-1">
            Teste seus conhecimentos
          </h3>
          <p className="text-white/90 text-sm">
            Pergunta {indice + 1} de {QUESTOES.length}
          </p>

          <div className="mt-5 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--color-bg-surface)] p-8">
          <div className="flex items-center justify-between mb-6 text-sm">
            <span className="text-[var(--color-text-tertiary)]">Pontuação</span>
            <span className="font-bold text-[var(--color-primary)]">
              {score} acerto{score !== 1 ? "s" : ""}
            </span>
          </div>

          <p className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-6 leading-snug">
            {questao.q}
          </p>

          <div className="space-y-3 mb-6">
            {questao.opts.map((opt, i) => {
              const respondido = escolha !== null;
              const eCorreta = i === questao.ans;
              const eEscolhida = i === escolha;

              let cls =
                "w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium text-sm transition-all duration-200 ";

              if (!respondido) {
                cls +=
                  "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]";
              } else if (eCorreta) {
                cls +=
                  "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
              } else if (eEscolhida) {
                cls +=
                  "border-red-400 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300";
              } else {
                cls +=
                  "border-[var(--color-border)] text-[var(--color-text-tertiary)] opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={respondido}
                  className={cls}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`
                        w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                        text-xs font-bold border-2
                        ${
                          !respondido
                            ? "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                            : eCorreta
                              ? "border-emerald-400 bg-emerald-400 text-white"
                              : eEscolhida
                                ? "border-red-400 bg-red-400 text-white"
                                : "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                        }
                      `}
                    >
                      {respondido && eCorreta
                        ? "✓"
                        : respondido && eEscolhida
                          ? "✕"
                          : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {escolha !== null && (
            <div
              className={`
                p-4 rounded-xl text-sm mb-6 leading-6 border
                animate-[fadeSlideUp_0.3s_ease]
                ${
                  escolha === questao.ans
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300"
                    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300"
                }
              `}
            >
              <strong>
                {escolha === questao.ans ? "✅ Correto! " : "❌ Incorreto. "}
              </strong>
              {questao.exp}
            </div>
          )}

          {escolha !== null && (
            <button
              onClick={avancar}
              className="
                w-full py-3.5 rounded-full text-sm font-bold
                bg-[var(--color-primary)] text-white
                shadow-[var(--shadow-btn)]
                hover:bg-[var(--color-primary-hover)]
                hover:-translate-y-0.5
                transition-all animate-[fadeSlideUp_0.3s_ease]
              "
            >
              {indice + 1 < QUESTOES.length
                ? "Próxima pergunta →"
                : "Ver resultado →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EducacaoPage() {
  const [aba, setAba] = useState<Aba>("artigos");
  const [artigoAberto, setArtigoAberto] = useState(false);

  useScrollReveal([aba, artigoAberto]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      <section
        className="
          text-center py-20 md:py-28
          bg-[var(--color-bg-body)]
          [background-image:radial-gradient(circle_at_50%_0%,rgba(45,149,105,0.08)_0%,transparent_70%)]
          border-b border-[var(--color-border)]
          mb-16
        "
      >
        <div className="container-eco">
          <div className="animate-on-scroll">
            <span className="badge-eco mb-6 mx-auto">
              🎓 Centro de Aprendizado
            </span>

            <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Conhecimento para <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-blue-500">
                mudar o mundo
              </span>
            </h1>

            <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
              Entenda como suas escolhas impactam o planeta e descubra, passo a
              passo, como fazer parte da solução.
            </p>
          </div>
        </div>
      </section>

      <div className="container-eco pb-24">
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
                O que é Ecologia?
              </h2>
            </div>
          </div>

          <p className="text-[var(--color-text-secondary)] text-base leading-7 mb-8 max-w-3xl pl-[calc(3.5rem+1.25rem)]">
            A ecologia é a ciência que estuda as interações entre os seres vivos
            e o meio ambiente. É como uma grande rede onde tudo está conectado —
            plantas, animais, ar, água, solo e nós.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: "🌿",
                title: "Produtores",
                desc: "Plantas e algas que produzem seu próprio alimento através da fotossíntese, convertendo luz solar em energia vital.",
              },
              {
                icon: "🐾",
                title: "Consumidores",
                desc: "Animais que se alimentam de outros seres vivos. Podem ser herbívoros, carnívoros ou onívoros.",
              },
              {
                icon: "♻️",
                title: "Decompositores",
                desc: "Fungos e bactérias que decompõem matéria orgânica, reciclando nutrientes essenciais para o solo.",
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

          <div
            className="
              relative overflow-hidden
              bg-gradient-to-br from-[#1e293b] to-[#0f172a]
              text-white rounded-3xl p-10 text-center
              shadow-[var(--shadow-xl)]
            "
          >
            <span
              className="
                absolute top-[-1rem] right-6
                text-[12rem] leading-none
                text-white/[0.04] font-serif
                pointer-events-none select-none
              "
            >
              &ldquo;
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)] mb-5">
              Conceito Fundamental
            </p>
            <blockquote className="text-2xl md:text-3xl font-semibold italic leading-snug mb-4">
              &ldquo;Na natureza nada se cria, nada se perde, tudo se
              transforma&rdquo;
            </blockquote>
            <cite className="text-white/60 text-sm not-italic">
              — Antoine Lavoisier
            </cite>
          </div>
        </section>

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
            Sustentabilidade significa atender às necessidades do presente sem
            comprometer a capacidade das futuras gerações de atenderem às suas
            próprias necessidades.
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
                desc: "Garantir bem-estar e justiça",
                bg: "bg-blue-50 dark:bg-blue-500/15",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: "🪙",
                label: "Econômico",
                desc: "Desenvolvimento viável e justo",
                bg: "bg-amber-50 dark:bg-amber-500/15",
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="
                  flex items-center gap-4 p-5
                  bg-[var(--color-bg-surface)]
                  rounded-xl border border-[var(--color-border)]
                  hover:-translate-y-0.5 hover:border-[var(--color-border-hover)]
                  transition-all
                "
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
                Dica Rápida
              </h4>
              <p className="text-amber-700/80 dark:text-amber-500 text-sm leading-6">
                Pequenas ações diárias fazem a diferença! Comece economizando
                água, separando o lixo e escolhendo produtos duráveis.
              </p>
            </div>
          </div>
        </section>

        <section className="animate-on-scroll">
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`
                  inline-flex items-center gap-2
                  px-5 py-2.5 rounded-full text-sm font-semibold
                  transition-all duration-200
                  ${
                    aba === a.id
                      ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-btn)]"
                      : "bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }
                `}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          <div key={aba} className="animate-[fadeSlideUp_0.35s_ease]">
            {aba === "artigos" && (
              <SecaoArtigos onArtigoChange={setArtigoAberto} />
            )}
            {aba === "dicas" && <SecaoDicas />}
            {aba === "quiz" && <SecaoQuiz />}
          </div>
        </section>

        <section className="animate-on-scroll mt-20">
          <div
            className="
              text-center p-12 rounded-3xl
              bg-[var(--color-primary-light)]
              border border-dashed border-[var(--color-primary)]/50
              dark:bg-[rgba(45,149,105,0.1)]
            "
          >
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-text-primary)] mb-3">
              Pronto para agir?
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
              Visite nossa loja e descubra produtos que ajudam você a ter uma
              vida mais sustentável hoje mesmo.
            </p>
            <Link
              href="/produtos"
              className="
                inline-flex items-center gap-2
                px-8 py-4 rounded-full text-base font-bold
                bg-[var(--color-primary)] text-white
                shadow-[0_4px_12px_rgba(45,149,105,0.3)]
                hover:bg-[var(--color-primary-hover)]
                hover:-translate-y-0.5
                hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)]
                transition-all duration-200
              "
            >
              🛍️ Ver Produtos Eco-Friendly
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
