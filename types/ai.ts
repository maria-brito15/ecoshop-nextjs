// types/ai.ts

/**
 * ============================================================================
 * ARTIFICIAL INTELLIGENCE TYPES
 * ============================================================================
 * Este arquivo contém os tipos relacionados às funcionalidades de IA
 * do EcoShop, incluindo análise de imagens (EcoScan) e chat sustentável.
 *
 * A IA utiliza dois provedores:
 * - Azure Custom Vision: classificação de imagens (identifica materiais)
 * - Google Gemini 2.0 Flash: geração de textos (análise, chat)
 * ============================================================================
 */

/**
 * Análise completa gerada pela IA para um material reciclável.
 * Retornado pelo Gemini com base no prompt em lib/ai/prompts/sustentabilidade.ts
 *
 * TODOS os campos são strings obrigatórios (mínimo 1 caractere)
 * para garantir que o frontend sempre tenha conteúdo para exibir.
 */
export interface AnaliseIA {
  /**
   * Impacto ambiental do material.
   * Inclui consequências para fauna/flora, dados estatísticos sobre produção
   * e descarte incorreto. Ex: "A produção de plástico emite 1.8 toneladas de CO₂..."
   */
  impacto_ambiental: string;

  /**
   * Tempo estimado de decomposição na natureza.
   * Inclui fatores que afetam a decomposição (temperatura, umidade)
   * e comparação com outros materiais.
   * Ex: "Garrafa PET: 400+ anos. Isopor: nunca se decompõe completamente."
   */
  tempo_decomposicao: string;

  /**
   * Instruções detalhadas de descarte correto.
   * Inclui cor da lixeira (coleta seletiva), preparação (limpeza, amassar),
   * locais alternativos (PEVs, cooperativas) e o que NÃO fazer.
   * Ex: "Plástico → lixeira vermelha. Enxágue antes de descartar."
   */
  onde_descartar: string;

  /**
   * Avaliação da reciclabilidade do material.
   * Inclui nível (Alto/Médio/Baixo), percentuais de reciclagem no Brasil/mundo,
   * processo resumido e limitações técnicas.
   * Ex: "Vidro: reciclabilidade ALTA. No Brasil, 47% é reciclado."
   */
  reciclabilidade: string;

  /**
   * Dicas práticas para redução, reutilização e alternativas sustentáveis.
   * De 4 a 5 dicas acionáveis para o usuário aplicar no dia a dia.
   * Ex: "Prefira garrafas reutilizáveis. Evite canudos plásticos."
   */
  dicas_sustentaveis: string;

  /**
   * Benefícios ambientais da reciclagem deste material específico.
   * Inclui economia de recursos (com números quando possível),
   * redução de emissões CO₂ e geração de empregos na cadeia.
   * Ex: "Reciclar 1 tonelada de papel salva 17 árvores."
   */
  beneficios_reciclagem: string;
}

/**
 * Resultado completo da operação de scan (análise de imagem).
 * Pode representar SUCESSO (identificação com confiança ≥ threshold)
 * ou FALHA (baixa confiança, material não reconhecido, erro do provedor).
 *
 * Usa discriminated union via campo 'sucesso':
 * - sucesso: true → material, confianca, analise_sustentabilidade presentes
 * - sucesso: false → mensagem, sugestao, confianca_minima_requerida presentes
 */
export interface ResultadoScan {
  /** Indica se a análise foi bem-sucedida (confiança ≥ threshold configurado) */
  sucesso: boolean;

  // --- CAMPOS PARA SUCESSO (sucesso = true) ---
  /** Material identificado pela IA (ex: "plastico", "vidro", "papelao") */
  material?: string;
  /** Confiança da classificação (0 a 100) — valor real percentual */
  confianca?: number;
  /** ID único gerado para esta análise (formato: analise_{timestamp}_{random}) */
  imageId?: string;
  /** Análise detalhada de sustentabilidade gerada pelo Gemini */
  analise_sustentabilidade?: AnaliseIA;

  // --- CAMPOS PARA FALHA (sucesso = false) ---
  /** Mensagem amigável explicando o motivo da falha */
  mensagem?: string;
  /** Dica para o usuário melhorar a foto (iluminação, proximidade) */
  sugestao?: string;
  /** Confiança mínima exigida para considerar uma identificação válida (valor percentual) */
  confianca_minima_requerida?: number;
  /** Material com maior probabilidade (mesmo abaixo do threshold) */
  material_provavel?: string;

  // --- CAMPOS COMUNS (presentes sempre) ---
  /** Timestamp ISO 8601 da análise (ex: "2026-05-18T10:30:00.000Z") */
  timestamp: string;
}

/**
 * Mensagem individual no histórico do chat com IA.
 * Segue o formato esperado pela API do Google Gemini.
 */
export interface ChatMessage {
  /** Remetente da mensagem: 'user' para o usuário, 'model' para a IA */
  role: "user" | "model";
  /** Array de partes da mensagem (atualmente apenas uma com texto) */
  parts: { text: string }[];
}

/**
 * Corpo da requisição para o endpoint POST /api/ia/chat
 * Envia a mensagem do usuário e o histórico da conversa para manter contexto.
 */
export interface ChatBody {
  /** Mensagem atual do usuário (mínimo 1 caractere, máximo 2000) */
  mensagem: string;
  /**
   * Histórico da conversa (opcional).
   * Permite que a IA mantenha coerência em conversas multi-turno.
   * Exemplo: [{ role: "user", parts: [{ text: "O que é reciclagem?" }] },
   *           { role: "model", parts: [{ text: "Reciclagem é..." }] }]
   */
  historico?: ChatMessage[];
}

/**
 * Resposta do endpoint POST /api/ia/chat
 * Retorna apenas o texto gerado pela IA (sem metadados para simplificar).
 */
export interface ChatResponse {
  /** Texto da resposta gerada pelo modelo Gemini */
  resposta: string;
}

/**
 * Alias para ResultadoScan mantido para compatibilidade com código legado.
 * ScanResponse é o tipo retornado pelo endpoint POST /api/ia/scan
 */
export interface ScanResponse extends ResultadoScan {}
