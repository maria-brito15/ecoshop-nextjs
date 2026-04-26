"use client";

import { useState } from "react";
import Link from "next/link";

interface EducationalContent {
  id: number;
  title: string;
  icon: string;
  content: string;
  tips: string[];
}

const EDUCATIONAL_CONTENT: EducationalContent[] = [
  {
    id: 1,
    title: "Redução de Plástico",
    icon: "♻️",
    content:
      "Aprenda como reduzir o uso de plástico no seu dia a dia e contribuir para um planeta mais limpo.",
    tips: [
      "Use sacolas reutilizáveis",
      "Escolha produtos sem embalagem",
      "Recicle corretamente",
      "Compre em granel",
    ],
  },
  {
    id: 2,
    title: "Economia de Água",
    icon: "💧",
    content:
      "Descubra formas práticas de economizar água em sua casa e preservar este recurso precioso.",
    tips: [
      "Diminua duração do banho",
      "Feche a torneira ao lavar louça",
      "Reutilize água de chuva",
      "Repare vazamentos",
    ],
  },
  {
    id: 3,
    title: "Consumo Consciente",
    icon: "🛒",
    content:
      "Entenda como suas escolhas de compra impactam o meio ambiente e a sociedade.",
    tips: [
      "Compre apenas o necessário",
      "Prefira marcas sustentáveis",
      "Valide a procedência",
      "Apoie empresas éticas",
    ],
  },
  {
    id: 4,
    title: "Sustentabilidade em Casa",
    icon: "🏠",
    content:
      "Transforme sua casa em um ambiente mais sustentável com simples mudanças.",
    tips: [
      "Use energia renovável",
      "Plante flores e plantas",
      "Compostagem doméstica",
      "Eficiência energética",
    ],
  },
  {
    id: 5,
    title: "Moda Sustentável",
    icon: "👕",
    content:
      "Descubra tendências de moda que respeitam o meio ambiente e os direitos humanos.",
    tips: [
      "Compre roupas de qualidade",
      "Aproveite ao máximo cada peça",
      "Doe roupas não usadas",
      "Escolha fibras naturais",
    ],
  },
  {
    id: 6,
    title: "Alimentação Consciente",
    icon: "🥗",
    content:
      "Aprenda sobre alimentação sustentável e seus benefícios para a saúde e o planeta.",
    tips: [
      "Reduza consumo de carne",
      "Compre alimentos locais",
      "Minimize desperdício",
      "Cultive sua horta",
    ],
  },
];

export default function EducacaoPage() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-16 text-center">
          <span className="inline-block text-sm font-bold text-[#2d9569] uppercase tracking-widest bg-[#e6f5ef] px-4 py-2 rounded-full mb-4">
            Aprenda
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#1a3a2e] mb-6">
            Centro Educativo EcoShop
          </h1>
          <p className="text-xl text-[#5a7a6f] max-w-2xl mx-auto">
            Explore conteúdos sobre sustentabilidade e descubra como suas
            pequenas ações fazem uma grande diferença no mundo
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Artigos", value: "150+" },
            { label: "Dicas Práticas", value: "500+" },
            { label: "Pessoas Inspiradas", value: "50K+" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-[#e3ede8] rounded-2xl p-8 text-center"
            >
              <p className="text-3xl font-extrabold text-[#2d9569] mb-2">
                {stat.value}
              </p>
              <p className="text-[#8fa89e] font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {EDUCATIONAL_CONTENT.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#e3ede8] rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                className="w-full p-6 text-left hover:bg-[#f7faf8] transition-colors border-b border-[#e3ede8] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1a3a2e] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[#5a7a6f] text-sm">{item.content}</p>
                  </div>
                  <span
                    className="text-[#2d9569] font-bold text-2xl flex-shrink-0 transition-transform duration-300"
                    style={{
                      transform:
                        expandedId === item.id
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {expandedId === item.id && (
                <div className="p-6 bg-[#f7faf8] border-t border-[#e3ede8]">
                  <h4 className="font-bold text-[#1a3a2e] mb-4">
                    Dicas Práticas:
                  </h4>
                  <ul className="space-y-3">
                    {item.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[#5a7a6f]"
                      >
                        <span className="text-[#2d9569] font-bold flex-shrink-0 mt-1">
                          ✓
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e3ede8] rounded-2xl p-8 md:p-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-[#1a3a2e] mb-6">
                Teste Seus Conhecimentos
              </h2>
              <p className="text-lg text-[#5a7a6f] mb-8">
                Faça nosso quiz interativo sobre sustentabilidade e descubra seu
                nível de conhecimento sobre práticas eco-friendly.
              </p>
              <button
                className="px-8 py-3.5 bg-[#2d9569] hover:bg-[#237852] text-white font-semibold rounded-full transition-all duration-200"
                style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
              >
                Começar Quiz
              </button>
            </div>
            <div className="bg-gradient-to-br from-[#e6f5ef] to-[#f7faf8] rounded-2xl p-8 text-center">
              <span className="text-6xl mb-4 block">🎓</span>
              <p className="text-[#1a3a2e] font-bold">
                10 Questões • 5 minutos
              </p>
              <p className="text-[#8fa89e] text-sm mt-2">
                Aprenda enquanto se diverte!
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-extrabold text-[#1a3a2e] mb-8">
            Recursos em Vídeo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Como Começar com Compostagem", duration: "8:32" },
              { title: "Impacto do Plástico nos Oceanos", duration: "12:45" },
              { title: "Moda Sustentável 101", duration: "10:20" },
            ].map((video, i) => (
              <div
                key={i}
                className="bg-white border border-[#e3ede8] rounded-2xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 bg-gradient-to-br from-[#e6f5ef] to-[#f1f6f3] flex items-center justify-center group-hover:from-[#d0ecdf] group-hover:to-[#e6f5ef] transition-all duration-300">
                  <span className="text-5xl">▶</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-[#1a3a2e] mb-2">{video.title}</p>
                  <p className="text-sm text-[#8fa89e]">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-12 md:p-16 text-center text-white"
          style={{
            background: "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
          }}
        >
          <h2 className="text-4xl font-extrabold mb-6">
            Pronto para Fazer a Diferença?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Explore nossa loja e escolha produtos que refletem seus valores de
            sustentabilidade
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#2d9569] font-semibold px-8 py-3.5 rounded-full transition-all duration-200"
          >
            Explorar Produtos Eco <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
