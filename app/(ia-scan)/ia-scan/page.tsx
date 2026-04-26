// app/(ia-scan)/page.tsx

"use client";

import { useState } from "react";
import { useScan } from "@/lib/hooks/useIA";
import type { ScanSucesso, ScanInsuficiente } from "@/types/api";

export default function IaScanPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const { data, carregando, erro, executar } = useScan();

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setPreview(URL.createObjectURL(arquivo));

    const form = new FormData();
    form.append("image", arquivo);
    executar("/api/ia/scan", form);
  }

  return (
    <main>
      <h1>Análise de Material Reciclável</h1>
      <p>
        Envie uma foto de um objeto para identificar o material e receber dicas
        de descarte.
      </p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleArquivo}
        disabled={carregando}
      />

      {preview && (
        <div>
          <img src={preview} alt="Preview" width={300} />
        </div>
      )}

      {carregando && <p>Analisando imagem...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {data && data.sucesso && <ResultadoSucesso data={data} />}

      {data && !data.sucesso && <ResultadoInsuficiente data={data} />}
    </main>
  );
}

function ResultadoSucesso({ data }: { data: ScanSucesso }) {
  const a = data.analise_sustentabilidade;

  return (
    <section>
      <h2>Material identificado: {data.material}</h2>
      <p>Confiança: {data.confianca.toFixed(1)}%</p>

      <h3>Análise de Sustentabilidade</h3>

      <div>
        <h4>Impacto Ambiental</h4>
        <p>{a.impacto_ambiental}</p>
      </div>

      <div>
        <h4>Tempo de Decomposição</h4>
        <p>{a.tempo_decomposicao}</p>
      </div>

      <div>
        <h4>Onde Descartar</h4>
        <p>{a.onde_descartar}</p>
      </div>

      <div>
        <h4>Reciclabilidade</h4>
        <p>{a.reciclabilidade}</p>
      </div>

      <div>
        <h4>Dicas Sustentáveis</h4>
        <p>{a.dicas_sustentaveis}</p>
      </div>

      <div>
        <h4>Benefícios da Reciclagem</h4>
        <p>{a.beneficios_reciclagem}</p>
      </div>
    </section>
  );
}

function ResultadoInsuficiente({ data }: { data: ScanInsuficiente }) {
  return (
    <section>
      <h2>Não foi possível identificar</h2>
      <p>{data.mensagem}</p>
      <p>
        Confiança obtida: {data.confianca.toFixed(1)}% (mínimo necessário:{" "}
        {data.confianca_minima_requerida}%)
      </p>
      <p>
        <strong>Sugestão:</strong> {data.sugestao}
      </p>
    </section>
  );
}
