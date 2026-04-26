// app/(educacao)/page.tsx

"use client";

import { useState } from "react";

type Aba = "artigos" | "dicas" | "quiz";

type Artigo = {
  tag: "verde" | "agua" | "energia" | "consumo";
  tagLabel: string;
  title: string;
  time: string;
  summary: string;
  body: string;
};

type Dica = {
  icon: string;
  title: string;
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
    title: "Por que a coleta seletiva importa?",
    time: "4 min",
    summary:
      "A separação correta do lixo reduz em até 30% o volume enviado aos aterros sanitários e viabiliza a cadeia de reciclagem.",
    body: "A coleta seletiva é o primeiro passo para uma cadeia de reciclagem eficiente. Quando separamos o lixo corretamente em casa, facilitamos o trabalho das cooperativas de catadores e reduzimos drasticamente o volume de resíduos que vai para aterros sanitários. Estudos indicam que municípios com programas ativos de coleta seletiva reduzem em até 30% o material destinado a aterros. Isso prolonga a vida útil desses espaços e diminui a emissão de metano, gás altamente poluente. O passo mais simples: separe lixo seco (plástico, papel, metal, vidro) do lixo úmido (restos de comida). Muitos municípios oferecem coleta diferenciada para cada tipo.",
  },
  {
    tag: "agua",
    tagLabel: "Água",
    title: "Como reduzir o consumo de água em casa",
    time: "3 min",
    summary:
      "Pequenos hábitos diários podem economizar centenas de litros por mês sem abrir mão do conforto.",
    body: "O consumo consciente de água começa nos pequenos hábitos. Fechar a torneira ao escovar os dentes economiza até 12 litros por minuto. No banho, reduzir o tempo em apenas dois minutos pode poupar cerca de 24 litros por dia. Além dos hábitos, é possível adaptar a casa: arejadores nas torneiras reduzem o fluxo sem prejudicar a sensação de pressão, e descargas com acionamento duplo economizam até 60% de água por uso. Reutilizar a água da máquina de lavar para limpar calçadas ou regar plantas é outra prática simples com grande impacto acumulado ao longo do mês.",
  },
  {
    tag: "energia",
    tagLabel: "Energia",
    title: "Eficiência energética: o que muda na prática",
    time: "5 min",
    summary:
      "Trocar lâmpadas incandescentes por LED e desligar aparelhos em standby pode reduzir até 20% da conta de luz.",
    body: "A eficiência energética é uma das formas mais acessíveis de reduzir o impacto ambiental. Lâmpadas LED consomem até 80% menos energia do que as incandescentes e duram muito mais tempo, o que compensa rapidamente o investimento inicial. Aparelhos em modo standby representam de 5% a 12% do consumo total de energia de uma residência. Desligá-los da tomada quando não estão em uso é um hábito simples e eficaz. Eletrodomésticos com o selo Procel A são mais eficientes e, no longo prazo, mais econômicos.",
  },
  {
    tag: "consumo",
    tagLabel: "Consumo",
    title: "Consumo consciente além do clichê",
    time: "6 min",
    summary:
      "Antes de comprar, pergunte: preciso disso? O que acontece quando descarto? Entenda o ciclo de vida dos produtos.",
    body: "Consumo consciente não significa comprar menos de forma absoluta — significa comprar com mais intenção. Antes de qualquer compra, vale perguntar: preciso disso agora? Existe uma alternativa mais durável? O que acontece com esse produto quando eu descartar? O conceito de ciclo de vida considera todas as etapas: extração de matéria-prima, fabricação, transporte, uso e descarte. Priorizar marcas com certificações socioambientais, comprar usado quando possível e reparar antes de descartar são escolhas que, somadas, criam uma diferença real.",
  },
];

const DICAS: Dica[] = [
  {
    icon: "♻",
    title: "Plástico",
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
    tips: [
      "Restos de comida viram composto",
      "Cascas e borra de café são ótimos para hortas",
      "Lixeira marrom onde disponível",
      "Evite misturar com plástico ou papel",
    ],
  },
  {
    icon: "⚠",
    title: "Especial",
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

export default function EducacaoPage() {
  const [aba, setAba] = useState<Aba>("artigos");

  return (
    <main>
      <h1>Educação ambiental</h1>
      <p>
        Aprenda sobre sustentabilidade, descarte correto e consumo consciente.
      </p>

      <nav>
        {(["artigos", "dicas", "quiz"] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            style={{ fontWeight: aba === a ? "bold" : "normal" }}
          >
            {a === "artigos"
              ? "Artigos"
              : a === "dicas"
                ? "Dicas de reciclagem"
                : "Quiz"}
          </button>
        ))}
      </nav>

      <hr />

      {aba === "artigos" && <SecaoArtigos />}
      {aba === "dicas" && <SecaoDicas />}
      {aba === "quiz" && <SecaoQuiz />}
    </main>
  );
}

function SecaoArtigos() {
  const [aberto, setAberto] = useState<Artigo | null>(null);

  return (
    <section>
      <h2>Artigos</h2>

      {aberto ? (
        <div>
          <button onClick={() => setAberto(null)}>← Voltar</button>
          <p style={{ fontSize: 12 }}>
            {aberto.tagLabel} · {aberto.time} de leitura
          </p>
          <h3>{aberto.title}</h3>
          <p>{aberto.body}</p>
        </div>
      ) : (
        <ul>
          {ARTIGOS.map((a, i) => (
            <li key={i}>
              <p style={{ fontSize: 12 }}>
                {a.tagLabel} · {a.time} de leitura
              </p>
              <strong>{a.title}</strong>
              <p>{a.summary}</p>
              <button onClick={() => setAberto(a)}>Ler artigo →</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SecaoDicas() {
  const [selecionada, setSelecionada] = useState<Dica>(DICAS[0]);

  return (
    <section>
      <h2>Dicas de reciclagem</h2>

      <div>
        {DICAS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelecionada(d)}
            style={{
              fontWeight: selecionada.title === d.title ? "bold" : "normal",
            }}
          >
            {d.icon} {d.title}
          </button>
        ))}
      </div>

      <div>
        <h3>
          {selecionada.icon} {selecionada.title} — como descartar
        </h3>
        <ul>
          {selecionada.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SecaoQuiz() {
  const [indice, setIndice] = useState(0);
  const [score, setScore] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  const questao = QUESTOES[indice];

  function responder(i: number) {
    if (escolha !== null) return;
    setEscolha(i);
    if (i === questao.ans) setScore((s) => s + 1);
  }

  function avancar() {
    if (indice + 1 >= QUESTOES.length) {
      setFinalizado(true);
    } else {
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
    return (
      <section>
        <h2>Quiz</h2>
        <p>
          Resultado: {score}/{QUESTOES.length} ({pct}%)
        </p>
        <button onClick={reiniciar}>Tentar novamente</button>
      </section>
    );
  }

  return (
    <section>
      <h2>Quiz</h2>
      <p>
        Pergunta {indice + 1} de {QUESTOES.length}
      </p>
      <p>{questao.q}</p>

      <ul>
        {questao.opts.map((o, i) => (
          <li key={i}>
            <button
              onClick={() => responder(i)}
              disabled={escolha !== null}
              style={{
                fontWeight:
                  escolha !== null && i === questao.ans ? "bold" : "normal",
                color:
                  escolha === null
                    ? undefined
                    : i === questao.ans
                      ? "green"
                      : i === escolha
                        ? "red"
                        : undefined,
              }}
            >
              {o}
            </button>
          </li>
        ))}
      </ul>

      {escolha !== null && (
        <>
          <p>
            {escolha === questao.ans ? "Correto! " : "Incorreto. "}
            {questao.exp}
          </p>
          <button onClick={avancar}>
            {indice + 1 < QUESTOES.length
              ? "Próxima pergunta →"
              : "Ver resultado →"}
          </button>
        </>
      )}
    </section>
  );
}
