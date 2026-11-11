# PERF · Conta e perfil do usuário

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-11. ADRs: ADR-0017 · ADR-0021 · ADR-0004

## Objetivo

Permitir que o usuário veja e edite os próprios dados.

## Atores

CLIENTE · MARCA · ADMIN (cada um, no próprio perfil).

## Regras de negócio

- **BR-PERF-01** — Usuário só vê e edita o próprio perfil; ADMIN pode ver e editar qualquer um (via /api/usuarios/[id]).
- **BR-PERF-02** — O usuário não altera o próprio tipo.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-PERF-01 | Quando um usuário autenticado acessa o próprio perfil, o sistema deve exibir nome, e-mail, telefone e tipo. | Com cookie de CLIENTE: middleware libera /api/usuarios/{id} e o handler responde 200 sem senha |
| REQ-PERF-02 | Quando o usuário envia novo nome e/ou telefone para o próprio perfil, o sistema deve gravar os dados e devolver o usuário atualizado. | PUT /api/usuarios/{id} → 200; banco com os novos valores |
| REQ-PERF-03 | Se o corpo da edição inclui o campo tipo, o sistema deve ignorá-lo, mantendo o tipo atual. | PUT com tipo ADMIN por CLIENTE → tipo continua CLIENTE |
| REQ-PERF-04 | Se a edição do perfil falha, o sistema deve mostrar ao usuário a mensagem de erro devolvida pela API. | Resposta de erro com campo `erro` → a mensagem aparece na tela |
| REQ-PERF-05 | Quando o usuário visita um produto, o sistema deve registrar no histórico e mostrá-lo na aba Histórico do perfil. | Visitar 2 produtos → aba mostra 2 |
| REQ-PERF-06 | Quando o usuário abre a aba Impacto, o sistema deve exibir métricas derivadas de dados reais do próprio usuário. | Cada métrica tem fonte declarada |

## Casos-limite

Perfil de ADMIN segue as mesmas regras. Telefone vazio não é enviado (a página omite o campo). E-mail e senha são aceitos pelo schema de atualização, mas a página só edita nome e telefone.

## Interfaces

GET/PUT /api/usuarios/[id] · GET /api/auth/me · página /perfil.

## NFRs aplicáveis

NFR-SEG-01.

## Fora de escopo

Excluir a própria conta; alterar e-mail e senha pela tela.

## Perguntas abertas

1. O usuário pode alterar o próprio e-mail e senha? (a API permite; a tela não)
