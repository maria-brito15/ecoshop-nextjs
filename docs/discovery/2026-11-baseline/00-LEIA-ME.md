# EcoShop → Spec-Driven Development · Etapa 1: diagnóstico e proposta

> Somente análise e proposta. Nenhum arquivo do projeto foi alterado, nenhum artefato definitivo foi criado no repositório.
> Base: `ecoshop-nextjs-main.zip` (sem histórico git). Data: 2026-11-10.

## Ordem de leitura

| # | Documento | Entregável pedido |
|---|---|---|
| 01 | [Diagnóstico técnico](01-diagnostico-tecnico.md) | 1 · diagnóstico completo, com fatos/inferências/dúvidas |
| 02 | [Arquitetura atual](02-arquitetura-atual.md) | 2 · análise da arquitetura existente |
| 03 | [Metodologia SDD e Spec Kit](03-metodologia-sdd-e-spec-kit.md) | 3 · metodologia + 8 · integração do Spec Kit |
| 04 | [Constitution (proposta)](04-constitution-proposta.md) | 4 · Constitution |
| 05 | [Inventário de specs](05-inventario-specs.md) | 5 · specifications e requirements |
| 06 | [Inventário de ADRs](06-inventario-adrs.md) | 6 · ADRs existentes, inferidos e pendentes |
| 07 | [Estrutura do repositório](07-estrutura-repositorio.md) | 7 · estrutura de diretórios |
| 08 | [Claude Code](08-claude-code-skills-rules-agents-hooks.md) | 9 · Skills, Rules, Agents, Hooks |
| 09 | [Governança e drift](09-governanca-e-drift.md) | 10 · governança |
| 10 | [Roadmap e critérios](10-roadmap-e-criterios-de-sucesso.md) | 11 · roadmap + 12 · critérios de sucesso |
| 11 | [Respostas e correções iniciais](11-respostas-e-correcoes-iniciais.md) | Respostas da Fase 0 e patch de D2/D3 |

## Resumo em seis pontos

1. **O código é razoavelmente organizado** (camadas handler → service → Prisma, Zod na borda, IA bem decomposta, Docker bem montado). `tsc` e `build` passam.
2. **A documentação descreve intenção, não comportamento.** O README promete filtro por marca, galeria, gestão de usuários na UI, chat com auth e credenciais de seed que não existem no código.
3. **Há defeitos reais que nenhum gate pega:** perfil quebrado para não-admin (middleware contradiz o handler), hash de senha devolvido na edição de usuário, chat de IA público, seed que apaga produtos em todo `docker compose up`, nenhum login funcional num ambiente Docker novo, CI que falha no lint (logo, o deploy não roda).
4. **Não existe nenhum teste.** Por isso o SDD aqui precisa ser executável (testes com ID de requisito + scripts no CI), não só Markdown.
5. **Proposta:** Spec Kit como ferramenta central para as *mudanças* (`specs/NNN`), mais uma *spec viva por capacidade* (`docs/capabilities/`) como fonte de verdade do comportamento atual; 12 capacidades, 14 ADRs (2 de processo, 12 inferidos) e 10 decisões pendentes; 6 skills (4 adaptadas + `test-strategy` + `brownfield-discovery`), 3 agents somente leitura (`spec-reviewer` isolado, `verifier`, `drift-auditor`), hooks só para proteção e lembrete; o CI é o único gate coercitivo.
6. **Roadmap em 8 fases** (≈ 56–85 h até o piloto), começando por destravar o CI e terminando com a correção do perfil passando pelo fluxo completo.

## O que preciso de você para seguir (Fase 0)

1. EcoShop é vitrine/catálogo ou e-commerce com carrinho e pedido?
2. O que o papel MARCA deve poder fazer? Pode ser escolhido no cadastro público?
3. O chat de IA fica (e ganha UI) ou sai?
4. As métricas da home e o "impacto" por produto têm fonte, ou são ilustrativos?
5. O projeto está em produção com dados reais?
6. Há logs do GitHub Actions e um repositório git com histórico?
7. O modelo do Azure Custom Vision (tags reconhecidas) está documentado?
8. Constitution: algum princípio que você quer cortar, mudar ou acrescentar?
9. Defeitos D2/D3: corrigir já (opção A) ou levar para o piloto (opção B)? Veja o fim do doc 10.

## Convenções usadas nestes documentos

**[FATO]** verificado no código ou executado, com `arquivo:linha` · **[INFERÊNCIA]** conclusão ainda não executada em ambiente real · **[RECOMENDAÇÃO]** proposta, decisão sua · **[DÚVIDA]** precisa de validação humana.
