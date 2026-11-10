# 05 · Inventário e organização das especificações

## 1. Quatro coisas diferentes que costumam virar uma só

Usando um caso real do EcoShop (o EcoScan):

| Tipo | Pergunta | Exemplo | Onde mora | Muda quando |
|---|---|---|---|---|
| **Requisito** | O que o usuário/negócio precisa? | "Quem encontra um resíduo quer saber como descartá-lo corretamente." | `docs/product/` (necessidade) e `REQ-*` na spec | Muda a necessidade |
| **Especificação** | Qual comportamento observável atende? | `REQ-SCAN-03` Quando a maior confiança da classificação for menor que o limiar configurado, o sistema deve responder "não identificado", informar a confiança obtida e sugerir nova foto. | `docs/capabilities/ecoscan/spec.md` | Muda o comportamento esperado |
| **Decisão arquitetural** | Que escolha técnica e por quê? | Classificar com Azure Custom Vision e gerar a análise com Gemini, com fallback estático. | `docs/architecture/adr/` | Aparece alternativa melhor (novo ADR) |
| **Implementação** | Como está feito? | `lib/ai/analisar-imagem.ts`, `CONFIANCA_MINIMA = Number(env ?? 0.7)` | código | A qualquer momento, sem mudar os de cima |

Teste rápido para saber o tipo: se trocar Azure por outro classificador **não** muda o texto, então não é requisito nem spec. Se trocar o limiar de 70% para 80% muda o que o usuário vê, o limiar é parâmetro da spec (com valor padrão), não detalhe de implementação.

## 2. Documentos de produto (nível sistema)

| Documento | Conteúdo | Por que existe | Fonte para o baseline |
|---|---|---|---|
| `docs/product/overview.md` | Visão, problema, público, papéis, escopo e **fora de escopo** | Sem ele, não dá para decidir se "carrinho" é bug ou não-escopo | README + **suas respostas** às dúvidas 1–4 |
| `docs/product/glossario.md` | Linguagem ubíqua: Produto, Marca, Certificado, Material, Análise, Descarte, Papel… | O código já é em português; termos precisam de definição única (ex.: "Marca" é empresa ou usuário?) | `types/domain.ts`, `schema.prisma` |
| `docs/product/modelo-de-dominio.md` | Entidades, relações, invariantes, ciclo de vida | Separa o modelo conceitual do schema Prisma | `schema.prisma` + invariantes faltantes |
| `docs/product/requisitos-nao-funcionais.md` | `NFR-*`: segurança, disponibilidade/degradação, consistência de cache, desempenho, acessibilidade, privacidade | NFRs atravessam capacidades; repeti-los em cada spec gera drift | README "decisões técnicas", seção 7 da arquitetura |
| `docs/product/restricoes.md` | Restrições: stack, hospedagem VPS, orçamento de IA, idioma pt-BR | Separa "é assim porque decidimos" (ADR) de "é assim porque não temos escolha" | `ci.yml`, README |
| `docs/product/interfaces-externas.md` | Azure Custom Vision, Gemini, Postgres, Redis: contrato usado, limites, falhas | A spec do EcoScan depende de um modelo Azure treinado fora do repo | `lib/ai/providers/*` |

User stories e casos de uso: uso **CUJs** (jornadas críticas, formato do relatório de pesquisa) só nas capacidades com fluxo de várias etapas (EcoScan, login → perfil, painel). Para CRUDs, requisitos EARS bastam; user story ali seria cerimônia.

## 3. Specs de capacidade (spec viva), inventário

Prioridade de baseline: **P1** = tem defeito conhecido ou risco de segurança (escrever primeiro); **P2** = núcleo funcional; **P3** = conteúdo/estático.

| Cap. | Spec | Comportamento hoje (resumo) | Lacunas e defeitos | Perguntas abertas | Prioridade |
|---|---|---|---|---|---|
| **AUTZ** | `autorizacao/` | Matriz implícita em middleware + guards | D1, D3, `/ia-scan` público, `/api/admin` fantasma | Papel MARCA pode o quê? | **P1** |
| **AUTH** | `autenticacao/` | Login, logout, cadastro público, `me`, refresh; rate limit 10/min login, 5/h cadastro; JWT 7d | Sem revogação; cadastro escolhe MARCA; senha mín. 8 sem outras regras; `SameSite` | Sessão deve ser revogável? | **P1** |
| **PERF** | `conta-e-perfil/` | Ver/editar nome e telefone; histórico; aba "impacto" | D1 (quebrado), D2 (hash), D8, histórico nunca gravado | Histórico é requisito? Impacto pessoal de onde vem? | **P1** |
| **CAT** | `catalogo/` | Lista paginada (12), busca por nome, filtro por categoria; detalhe com certificados | Filtro de preço/ordenação só na página; sem filtro por marca; D9; "impacto" do produto calculado do preço | Ordenação e preço devem ser no catálogo inteiro? | P2 |
| **PROD** | `gestao-de-produtos/` | CRUD admin (painel lista até 100) | Sem vínculo produto↔certificado via API; `fotoUrl` sem UI de edição?; P2025 não mapeado no PUT | Quem mantém produtos: admin ou MARCA? | P2 |
| **REF** | `cadastros-de-referencia/` | CRUD admin de categorias, marcas, certificados | D7 (exclusão com vínculo → 500); marca exige `usuarioId` digitado; dono não precisa ser MARCA | Excluir com vínculo: bloquear (409) ou cascatear? | P2 |
| **MIDIA** | `midia-de-produto/` | Upload/lista/exclusão de fotos em filesystem (admin), 5 MB, extensão | Galeria não aparece para o cliente; `fotoUrl` desconectado; possível não servir em produção | Uma foto principal + galeria? | P2 |
| **USR** | `gestao-de-usuarios/` | API admin listar/criar/editar/excluir | Sem UI; exclusão de usuário com marca → 500 | Precisa de UI? | P2 |
| **SCAN** | `ecoscan/` | Foto → Azure → limiar → Gemini → 6 campos → fallback | D4; limites de upload diferentes de MIDIA; tags do modelo não documentadas | Quais materiais o modelo reconhece? Guardar histórico de scans? | P2 |
| **CHAT** | `chat-sustentabilidade/` | Só API, pública, com histórico enviado pelo cliente | D3; sem UI; prompt de sistema mandado como turno de usuário | **Manter ou remover?** | P1 (decisão) |
| **CONT** | `conteudo-institucional/` | Home, Educação (artigos e guia de descarte embutidos no código), Sobre | Métricas sem fonte; conteúdo hard-coded | Conteúdo deve ser editável? Fontes dos números? | P3 |
| **OPS** | `operacao/` | Health, seed, migrations, deploy | D5, D6, D10; health 503 com Redis fora | Há produção ativa? | **P1** |

Estrutura de cada spec de capacidade:

```
docs/capabilities/<cap>/
  spec.md      # objetivo · atores · regras de negócio (BR-*) · requisitos (REQ-*) em EARS
               # · critérios de aceite · casos-limite · interfaces (rotas, contratos) · NFRs aplicáveis (refs)
               # · fora de escopo · perguntas abertas · ADRs relacionados
  status.md    # REQ → status (✅ ◐ ❌ ❔) → evidência (teste, arquivo:linha) → última verificação
```

`status.md` separado da `spec.md` porque a spec muda quando o **esperado** muda e o status muda quando o **código** muda. Misturar as duas coisas faz o diff de spec virar ruído.

### Exemplo de requisitos retroativos (CAT), escritos como comportamento esperado

| ID | Requisito (EARS) | Critério de aceite | Status provável |
|---|---|---|---|
| REQ-CAT-01 | Quando um visitante abre o catálogo, o sistema deve listar produtos em páginas de 12, ordenados de forma estável, com o total de resultados. | `GET /api/produtos` sem parâmetros devolve ≤12 itens e `total` igual à contagem no banco | ✅ (sem teste → ◐ até ter teste) |
| REQ-CAT-02 | Quando o visitante informa um termo de busca, o sistema deve retornar apenas produtos cujo nome contém o termo, sem diferenciar maiúsculas. | busca "SABON" retorna "Sabonete…" | ◐ |
| REQ-CAT-05 | Se `page` ou `size` forem inválidos ou `size` > 50, então o sistema deve responder 400 com `codigo=PARAMETRO_INVALIDO`. | `size=1000` → 400 | ❌ (D9) |
| REQ-CAT-07 | Quando o visitante ordena por preço, o sistema deve ordenar o catálogo inteiro, não apenas a página exibida. | ❔ precisa da sua confirmação | ❌ |

Repare: REQ-CAT-05 e REQ-CAT-07 descrevem o **esperado**, não o atual. O status ❌ é que registra a diferença. É isso que "a spec representa o comportamento esperado, não a implementação" significa na prática.

## 4. Regras de negócio já identificáveis (candidatas a `BR-*`)

| ID provisório | Regra | Origem | Confirmar? |
|---|---|---|---|
| BR-01 | E-mail de usuário é único | constraint `usuarios_email_key` | Não |
| BR-02 | Cada marca pertence a exatamente um usuário, e cada usuário tem no máximo uma marca | `marcas_usuario_id_key` | Sim: o dono precisa ser MARCA? |
| BR-03 | Preço de produto é positivo, com 2 casas | Zod + `Decimal(10,2)` | Não |
| BR-04 | ADMIN não pode ser criado por cadastro público | `registroPublicoSchema` | Não |
| BR-05 | Material só é considerado identificado com confiança ≥ limiar (padrão 70%) e tag ≠ `outros` | `analisar-imagem.ts` | Limiar é decisão de produto? |
| BR-06 | Usuário só pode ver/editar o próprio perfil, exceto ADMIN | handler `usuarios/[id]` (intenção) | Sim (D1) |
| BR-07 | Usuário não pode alterar o próprio `tipo` | `atualizarUsuarioSchema` não tem `tipo` | Não |

## 5. Ordem de escrita no baseline

1. `overview.md` e `glossario.md` (depois das suas respostas).
2. P1: AUTZ, AUTH, PERF, OPS, decisão CHAT.
3. `requisitos-nao-funcionais.md` (puxando do que AUTZ/AUTH/OPS revelarem).
4. P2: CAT, PROD, REF, MIDIA, USR, SCAN.
5. P3: CONT.

Cada spec baseline passa pelo G1 como qualquer outra; o status inicial de cada `REQ` vem do código e dos primeiros testes de caracterização (Fase 3 do roadmap).
