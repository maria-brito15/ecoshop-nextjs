# CONT · Conteúdo institucional e educativo

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0014

## Objetivo

Apresentar a marca, a missão e conteúdo educativo sobre sustentabilidade.

## Atores

Visitante e usuários.

## Regras de negócio

- **BR-CONT-01** — Nenhum número ou dado exibido pode ser inventado sem fonte (Constitution, Art. XI).

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-CONT-01 | Quando um visitante abre a home, o sistema deve exibir a apresentação do EcoShop e o acesso ao catálogo. | Home renderiza com link para /produtos |
| REQ-CONT-02 | Quando a home exibe métricas, o sistema deve mostrar apenas números com fonte real identificável. | Cada métrica cita a origem ou é removida |
| REQ-CONT-03 | Quando um visitante abre a área de educação, o sistema deve exibir os conteúdos educativos. | /educacao renderiza os conteúdos |
| REQ-CONT-04 | Quando um visitante abre a página Sobre, o sistema deve exibir a equipe e a missão. | /sobre renderiza |
| REQ-CONT-05 | Quando um produto exibe seu impacto ambiental, o sistema deve usar dados cadastrados do produto. | Impacto vem de campo do produto |

## Casos-limite

Conteúdo estático; nenhuma regra de acesso.

## Interfaces

Páginas /, /educacao, /sobre.

## NFRs aplicáveis

NFR-ACE-01.

## Fora de escopo

CMS; blog.

## Perguntas abertas

1. Qual fonte real alimentará as métricas da home (REQ-CONT-02)?
