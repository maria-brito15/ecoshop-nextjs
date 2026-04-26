// lib/ai.ts

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";
const GEMINI_KEY = process.env.GEMINI_KEY ?? "";
const AZURE_URL = process.env.AZURE_VISION_ENDPOINT ?? "";
const AZURE_KEY = process.env.AZURE_VISION_KEY ?? "";

const CONFIANCA_MINIMA = 0.7;

const CAMPOS_OBRIGATORIOS = [
  "impacto_ambiental",
  "tempo_decomposicao",
  "onde_descartar",
  "reciclabilidade",
  "dicas_sustentaveis",
  "beneficios_reciclagem",
] as const;

export type AnaliseIA = Record<(typeof CAMPOS_OBRIGATORIOS)[number], string>;

export interface ResultadoScan {
  sucesso: boolean;
  material?: string;
  confianca?: number;
  imageId?: string;
  timestamp: string;
  analise_sustentabilidade?: AnaliseIA;
  mensagem?: string;
  sugestao?: string;
  confianca_minima_requerida?: number;
  material_provavel?: string;
}

interface AzurePrediction {
  tagName: string;
  probability: number;
}

interface AzureResponse {
  predictions: AzurePrediction[];
}

export async function classificarImagemAzure(
  imageBuffer: Buffer,
): Promise<AzureResponse | null> {
  if (!AZURE_URL || !AZURE_KEY || AZURE_KEY === "sua_chave") return null;

  const res = await fetch(AZURE_URL, {
    method: "POST",
    headers: {
      "Prediction-Key": AZURE_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(imageBuffer),
  });

  if (!res.ok) return null;
  return res.json();
}

const PROMPT_SUSTENTABILIDADE = (material: string) =>
  `
Você é um especialista renomado em sustentabilidade ambiental e ecologia, com profundo conhecimento sobre gestão de resíduos e economia circular. Analise detalhadamente o seguinte material de reciclagem: ${material}

Forneça uma análise COMPLETA em formato JSON com os seguintes campos:

1. impacto_ambiental: Impactos da produção e descarte incorreto, consequências na fauna e flora, dados estatísticos. (4-5 frases)
2. tempo_decomposicao: Tempo exato de decomposição na natureza, fatores que afetam, comparação com outros materiais.
3. onde_descartar: Cor da lixeira específica, preparação antes do descarte, locais alternativos, o que NÃO fazer.
4. reciclabilidade: Nível Alto/Médio/Baixo, percentual no Brasil e no mundo, processo resumido, limitações.
5. dicas_sustentaveis: 4-5 dicas práticas de redução, reutilização e alternativas sustentáveis.
6. beneficios_reciclagem: Economia de recursos (com números), redução de CO2, geração de empregos.

REGRAS:
- Responda APENAS com um objeto JSON válido, sem markdown, sem texto extra.
- Use \\n para quebras de linha dentro das strings.
- Foque no contexto brasileiro.

FORMATO: {"impacto_ambiental":"...","tempo_decomposicao":"...","onde_descartar":"...","reciclabilidade":"...","dicas_sustentaveis":"...","beneficios_reciclagem":"..."}
`.trim();

export async function obterAnaliseSustentabilidade(
  material: string,
): Promise<AnaliseIA> {
  try {
    const body = {
      contents: [{ parts: [{ text: PROMPT_SUSTENTABILIDADE(material) }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const res = await fetch(`${GEMINI_URL}${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return analiseBasica(material);

    const data = await res.json();
    const texto: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const limpo = texto
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()
      .slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1 || undefined);

    const parsed = JSON.parse(limpo);

    const valido = CAMPOS_OBRIGATORIOS.every(
      (c) => typeof parsed[c] === "string" && parsed[c].trim().length > 0,
    );

    return valido ? parsed : analiseBasica(material);
  } catch {
    return analiseBasica(material);
  }
}

function analiseBasica(material: string): AnaliseIA {
  return {
    impacto_ambiental: `Material identificado como ${material}. A produção e descarte inadequado podem causar impactos ambientais significativos. É importante realizar o descarte correto para minimizar danos ao meio ambiente e permitir a reciclagem adequada.`,
    tempo_decomposicao: `O tempo de decomposição varia conforme as condições ambientais. Fatores como temperatura, umidade e exposição solar influenciam diretamente no processo de degradação natural.`,
    onde_descartar: `Descarte em pontos de coleta seletiva apropriados. Verifique com a prefeitura da sua cidade sobre Postos de Entrega Voluntária (PEVs) ou cooperativas de reciclagem próximas. Limpe o material antes de descartar.`,
    reciclabilidade: `A reciclabilidade deste material pode variar. Consulte especialistas locais em gestão de resíduos para informações detalhadas sobre o processo de reciclagem e suas limitações na sua região.`,
    dicas_sustentaveis: `Separe materiais recicláveis do lixo comum. Reduza o consumo sempre que possível. Procure alternativas reutilizáveis. Apoie empresas comprometidas com sustentabilidade e economia circular.`,
    beneficios_reciclagem: `A reciclagem reduz a necessidade de extração de recursos naturais, economiza energia, diminui emissões de gases de efeito estufa e gera empregos na cadeia de reciclagem.`,
  };
}

export async function analisarImagem(
  imageBuffer: Buffer,
  imageId: string,
): Promise<ResultadoScan> {
  const timestamp = new Date().toISOString();

  const azureRes = await classificarImagemAzure(imageBuffer);

  if (!azureRes || !azureRes.predictions?.length) {
    return {
      sucesso: false,
      mensagem:
        "Nenhuma predição retornada pelo serviço de visão computacional.",
      confianca: 0,
      confianca_minima_requerida: CONFIANCA_MINIMA * 100,
      material_provavel: "N/A",
      imageId,
      timestamp,
      sugestao:
        "Verifique se as credenciais Azure estão configuradas corretamente.",
    };
  }

  const melhor = azureRes.predictions.reduce((a, b) =>
    a.probability > b.probability ? a : b,
  );

  if (melhor.probability < CONFIANCA_MINIMA || melhor.tagName === "outros") {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível identificar o objeto com confiança suficiente.",
      confianca: Math.round(melhor.probability * 10000) / 100,
      confianca_minima_requerida: CONFIANCA_MINIMA * 100,
      material_provavel: melhor.tagName,
      imageId,
      timestamp,
      sugestao:
        "Tente tirar uma foto mais próxima e com melhor iluminação. Certifique-se de que o material está limpo e bem enquadrado.",
    };
  }

  const analise = await obterAnaliseSustentabilidade(melhor.tagName);

  return {
    sucesso: true,
    material: melhor.tagName,
    confianca: Math.round(melhor.probability * 10000) / 100,
    imageId,
    timestamp,
    analise_sustentabilidade: analise,
  };
}
