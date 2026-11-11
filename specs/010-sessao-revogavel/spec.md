# Spec de mudança: 010-sessao-revogavel

- **Trilha:** correção com mudança de regra (P02; substitui o ADR-0007)
- **Capacidades afetadas:** AUTH, AUTZ
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono), **sem commits**; consolidada nas specs vivas
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

Sessão de 7 dias sem revogação: admin rebaixado, usuário excluído e sessão sequestrada continuam valendo; trocar senha não encerra sessões; trocar a própria senha não exige a atual; login revelava, pelo tempo, quais e-mails têm conta.

## Fora de escopo

Tela de troca de senha no perfil (hoje não há campo), logout de todos os dispositivos por ação do usuário, auditoria de logins.

## Requisitos

REQ-AUTH-18 a 23 (`docs/capabilities/autenticacao`).

## Decisão registrada

ADR-0021 (substitui o ADR-0007).

## Verificação

`tests/integration/sessao.test.ts` (22 testes; os de HTTP com banco **não foram executados**).

## Perguntas em aberto

Nenhuma bloqueante.
