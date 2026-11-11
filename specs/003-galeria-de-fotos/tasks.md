# Tarefas: 003-galeria-de-fotos

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | `app/(store)/produtos/[id]/page.tsx`: consumir `useListarFotos`, calcular `imagemPrincipal` (seleção > fotoUrl > primeira foto) e renderizar faixa de miniaturas clicáveis | REQ-MIDIA-04 | — | código compila (`tsc`), lint sem erro novo | [x] |
| T2 | Verificar a API que a galeria consome (`GET /api/produtos/{id}/fotos`) contra o dev server real, com um produto com 2 fotos | REQ-MIDIA-04 | T1 | `curl` confirma `total: 2` e as URLs corretas | [x] |
| T3 | Consolidar `midia-de-produto/{spec,status}.md`; remover a linha da galeria de `pendentes.md` | — | T1, T2 | `npm run sdd:check` passa | [x] |

## Nota

REQ-MIDIA-04 ficou como ◐, não ✅: verifiquei o código e a API real via `curl`, mas não há ferramenta de navegador nesta sessão para confirmar visualmente que as miniaturas aparecem e trocam a imagem principal na tela (a página é client-side; o HTML inicial via `curl` não carrega os dados pós-hidratação). Falta um `manual: AAAA-MM-DD` com navegador para virar ✅.
