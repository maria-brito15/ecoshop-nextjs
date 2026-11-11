# Plano: 009-erros-e-entrada

- **Status:** Implementado em 2026-11-11 (G2 tratado como concedido pela autonomia do dono). Sem ADR: segue a Constitution Art. VI–VIII e o ADR-0017, e não decide arquitetura nova.

## Decisões técnicas

- **Erros de domínio (Art. VII):** duas classes em `lib/errors/dominio.ts`, `RecursoNaoEncontrado(recurso)` (→ 404) e `ConflitoDeNegocio(mensagem)` (→ 409). O Art. VII dá nomes só como exemplo; duas classes cobrem todos os casos atuais (inexistência; e-mail repetido, tipo inválido, marca não pendente, auto-exclusão) sem criar uma hierarquia sem uso (YAGNI).
- **Mapeador único:** `mapeiaErroPrisma` vira `mapeiaErro`: trata primeiro os erros de domínio, depois os códigos do Prisma (`err.code`), e não olha mais `err.message`. As mensagens HTTP existentes são preservadas.
- **Constraint única no lugar de checar antes:** `criarUsuario` e `atualizarUsuario` capturam P2002 e lançam `ConflitoDeNegocio("Email já cadastrado")`; a checagem prévia continua só como atalho amigável e passa a ignorar a caixa.
- **`id` de rota:** `parseId(texto)` em `lib/schemas/id.ts` (expressão `^[1-9]\d{0,9}$` e limite 2147483647) e `idDaRota(params)` em `lib/http/params.ts`. Cada handler responde `ERROS.dadosInvalidos("ID inválido")`.
- **E-mail e senha:** `emailSchema` (`trim` + `toLowerCase` + `email`) e `senhaSchema` (mínimo 8, máximo 72 bytes medidos com `TextEncoder`, que funciona também no navegador) em `lib/schemas/user.ts`.
- **`next`:** `caminhoLocalOuRaiz(valor)` em `lib/http/next-url.ts`, função pura usada pela tela de login.
- **Timeouts:** `fetchComTimeout(url, init, ms)` em `lib/http/fetch-with-timeout.ts` usa `AbortSignal.timeout`. Os provedores recebem o tempo como parâmetro com valor padrão em constante (testável sem esperar 10 s).
- **Gemini:** o provedor ganha `gerarComHistorico` e `geminiConfigurado`; a chave vai no cabeçalho `x-goog-api-key`; o handler do chat deixa de ter sua própria chamada. `gerarTexto` passa a capturar falhas e devolver `null` (o scan já cai na contingência).

## Verificação

Testes em `tests/integration/input-and-errors.test.ts`. Os que não precisam de banco (mapeador, `parseId`, schemas, `next`, timeouts, rotas que respondem 400 antes de tocar o banco, chat, scan) são executados nesta sessão; os que precisam de banco (404/409 de ponta a ponta, busca sem caixa) foram escritos e rodam no CI. Ao final: `tsc`, lint e `sdd:check`.
