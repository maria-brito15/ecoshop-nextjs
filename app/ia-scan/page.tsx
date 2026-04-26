"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function IAScanPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult({
        productName: "Garrafa de Água Reutilizável",
        ecoScore: 92,
        material: "Aço Inoxidável Reciclado",
        recyclability: "100%",
        carbonFootprint: "0.5 kg CO2",
        recommendations: [
          "Produto altamente sustentável",
          "Feito com materiais reciclados",
          "Totalmente reciclável",
          "Reduz plástico descartável",
        ],
        certifications: ["FSC", "Eco-Label", "Carbono Neutro"],
      });
      setAnalyzing(false);
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.backgroundColor = "#d0ecdf";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-16 text-center">
          <span className="inline-block text-sm font-bold text-[#2d9569] uppercase tracking-widest bg-[#e6f5ef] px-4 py-2 rounded-full mb-4">
            Tecnologia IA
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#1a3a2e] mb-6">
            EcoScan IA
          </h1>
          <p className="text-xl text-[#5a7a6f] max-w-2xl mx-auto">
            Use nossa tecnologia de IA para analisar produtos e descobrir seu
            impacto ambiental em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div
              className="bg-white border-2 border-dashed border-[#e3ede8] rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-[#2d9569]"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {selectedImage ? (
                <div>
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="max-w-full max-h-96 mx-auto mb-6 rounded-lg"
                  />
                  <p className="text-[#8fa89e] text-sm mb-4">
                    Clique para mudar a imagem
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-6xl block mb-4">📸</span>
                  <h3 className="text-2xl font-bold text-[#1a3a2e] mb-2">
                    Selecione uma Imagem
                  </h3>
                  <p className="text-[#5a7a6f] mb-4">
                    Arraste e solte a imagem do produto aqui ou clique para
                    selecionar
                  </p>
                  <p className="text-sm text-[#8fa89e]">
                    Formatos suportados: JPG, PNG, WebP (máx. 5MB)
                  </p>
                </div>
              )}
            </div>

            {selectedImage && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full mt-6 px-8 py-3.5 bg-[#2d9569] hover:bg-[#237852] disabled:bg-gray-400 text-white font-semibold rounded-full transition-all duration-200"
                style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
              >
                {analyzing ? "Analisando..." : "Analisar Produto"}
              </button>
            )}
          </div>

          <div>
            {analyzing ? (
              <div className="bg-white border border-[#e3ede8] rounded-2xl p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-[#e3ede8] border-t-[#2d9569] rounded-full mx-auto mb-4" />
                <p className="text-[#5a7a6f]">Analisando imagem...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                <div className="bg-white border border-[#e3ede8] rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-[#1a3a2e] mb-4">
                    {analysisResult.productName}
                  </h2>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#1a3a2e]">
                        Eco Score
                      </span>
                      <span className="text-2xl font-extrabold text-[#2d9569]">
                        {analysisResult.ecoScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-[#e3ede8] rounded-full h-2">
                      <div
                        className="bg-[#2d9569] h-2 rounded-full"
                        style={{ width: `${analysisResult.ecoScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f7faf8] rounded-lg p-4">
                      <p className="text-xs text-[#8fa89e] font-semibold mb-1">
                        MATERIAL
                      </p>
                      <p className="font-bold text-[#1a3a2e]">
                        {analysisResult.material}
                      </p>
                    </div>
                    <div className="bg-[#f7faf8] rounded-lg p-4">
                      <p className="text-xs text-[#8fa89e] font-semibold mb-1">
                        RECICLABILIDADE
                      </p>
                      <p className="font-bold text-[#2d9569]">
                        {analysisResult.recyclability}
                      </p>
                    </div>
                    <div className="bg-[#f7faf8] rounded-lg p-4">
                      <p className="text-xs text-[#8fa89e] font-semibold mb-1">
                        PEGADA DE CARBONO
                      </p>
                      <p className="font-bold text-[#1a3a2e]">
                        {analysisResult.carbonFootprint}
                      </p>
                    </div>
                    <div className="bg-[#f7faf8] rounded-lg p-4">
                      <p className="text-xs text-[#8fa89e] font-semibold mb-1">
                        IMPACTO
                      </p>
                      <p className="font-bold text-green-600">Positivo ✓</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#e3ede8] rounded-2xl p-6">
                  <h3 className="font-bold text-[#1a3a2e] mb-4">
                    Recomendações
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map(
                      (rec: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-[#5a7a6f]"
                        >
                          <span className="text-[#2d9569] font-bold flex-shrink-0">
                            ✓
                          </span>
                          <span>{rec}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="bg-white border border-[#e3ede8] rounded-2xl p-6">
                  <h3 className="font-bold text-[#1a3a2e] mb-4">
                    Certificações
                  </h3>
                  <div className="flex gap-3 flex-wrap">
                    {analysisResult.certifications.map((cert: string) => (
                      <span
                        key={cert}
                        className="bg-[#e6f5ef] text-[#2d9569] px-4 py-2 rounded-full font-semibold text-sm"
                      >
                        🏅 {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full px-8 py-3.5 bg-[#2d9569] hover:bg-[#237852] text-white font-semibold rounded-full transition-all duration-200"
                  style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#e3ede8] rounded-2xl p-8 text-center">
                <span className="text-6xl block mb-4">🤖</span>
                <h3 className="text-xl font-bold text-[#1a3a2e] mb-2">
                  Como Funciona
                </h3>
                <ol className="text-left space-y-4 text-[#5a7a6f]">
                  <li className="flex gap-3">
                    <span className="font-bold text-[#2d9569] flex-shrink-0">
                      1.
                    </span>
                    <span>Selecione a imagem do produto</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#2d9569] flex-shrink-0">
                      2.
                    </span>
                    <span>Nossa IA analisa o produto</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#2d9569] flex-shrink-0">
                      3.
                    </span>
                    <span>Obtenha resultado do eco score</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#2d9569] flex-shrink-0">
                      4.
                    </span>
                    <span>Receba recomendações personalizadas</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-[#e3ede8]">
          <h2 className="text-4xl font-extrabold text-[#1a3a2e] mb-8 text-center">
            Recursos do EcoScan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🔍",
                title: "Análise Detalhada",
                desc: "Informações completas sobre materiais e produção",
              },
              {
                icon: "⚡",
                title: "Resultado Instantâneo",
                desc: "Análise rápida em apenas 2 segundos",
              },
              {
                icon: "🌍",
                title: "Impacto Global",
                desc: "Veja o impacto ambiental calculado",
              },
              {
                icon: "💡",
                title: "Recomendações",
                desc: "Dicas para consumo mais consciente",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white border border-[#e3ede8] rounded-2xl p-6 text-center"
              >
                <span className="text-4xl block mb-3">{feature.icon}</span>
                <h3 className="font-bold text-[#1a3a2e] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#5a7a6f]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-20 rounded-2xl p-12 md:p-16 text-center text-white"
          style={{
            background: "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
          }}
        >
          <h2 className="text-4xl font-extrabold mb-6">
            Comece a Usar EcoScan
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Analise qualquer produto e tome decisões de compra mais conscientes
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#2d9569] font-semibold px-8 py-3.5 rounded-full transition-all duration-200"
          >
            Enviar Imagem <span>→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
