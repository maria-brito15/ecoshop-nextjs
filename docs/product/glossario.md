# Glossário (linguagem ubíqua)

| Termo | Definição | Onde aparece |
|---|---|---|
| Usuário | Pessoa com conta (e-mail único). Tem um **tipo**. | `Usuario` |
| Tipo / Papel | `CLIENTE`, `MARCA` ou `ADMIN`. Define o que o usuário pode fazer. | `TipoUsuario` |
| Marca | Empresa que fabrica produtos do catálogo; pertence a **exatamente um** usuário (1:1). Não é o mesmo que o usuário. | `Marca` |
| Categoria | Agrupamento de produtos (ex.: Cosméticos Naturais). | `Categoria` |
| Produto | Item do catálogo: nome, descrição, preço, categoria, marca, foto, certificados. Não é item de compra. | `Produto` |
| Certificado | Selo de sustentabilidade emitido por um órgão (ex.: FSC). | `Certificado` |
| Foto | Imagem enviada para um produto, guardada em disco (`public/data_fotos`). Diferente de `fotoUrl`. | `foto.service.ts` |
| EcoScan | Funcionalidade que identifica o material de uma foto e explica o descarte. | `/ia-scan` |
| Material | Tag devolvida pelo classificador (Azure) para uma foto. | `tagName` |
| Confiança | Probabilidade (0–100%) do material identificado. | `AI_CONFIDENCE_THRESHOLD` |
| Análise de sustentabilidade | Os 6 campos gerados pelo Gemini: impacto, decomposição, onde descartar, reciclabilidade, dicas, benefícios. | `AnaliseIA` |
| Fallback | Análise estática usada quando o Gemini falha ou responde inválido. | `analiseBasica` |
| Spec viva | Documento de capacidade com o comportamento esperado hoje. | `docs/capabilities` |
| REQ / BR / NFR | Requisito / regra de negócio / requisito não funcional, com ID estável. | specs |
