# Tags do Azure Custom Vision (2026-11-10)

## Predição real
**Não deu para fazer.** O `AZURE_VISION_ENDPOINT` em `.env.local` é um valor de exemplo (host `seu-recurso.cognitiveservices.azure.com`), que não resolve no DNS (`ENOTFOUND`). A chave também não pode ser validada. Nenhuma imagem foi enviada a serviço externo.

## Tags citadas no repositório (fonte → o que dizem)
Nenhuma lista oficial das tags do modelo consta no repositório. O que existe:
- `lib/ai/analisar-imagem.ts:91` — trata a tag **`outros`** como "não identificado" (junto com probabilidade abaixo da confiança mínima).
- `lib/ai/providers/azure-vision.ts:11,34` — comentário: "plástico, vidro, papel, metal, orgânico, etc." e exemplo `"plastico", "vidro", "papel"`.
- `lib/ai/prompts/sustentabilidade.ts:10` — exemplo `"plastico", "vidro", "papelao"`; `types/ai.ts:85` idem.
- `tests/integration/ecoscan.test.ts` — dublês usam `plastico`, `papel`, `vidro`, `metal`, `outros`.

Isso são **exemplos e dublês**, não a lista real. Só `outros` tem tratamento no código. A lista de tags e sua grafia (com ou sem acento, `papel` × `papelao`) **não consta**; precisa ser lida no portal do Custom Vision (Performance → tags) ou por uma chamada com o endpoint real. ❔ pedir ao dono.
