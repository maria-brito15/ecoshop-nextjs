# ADR-0014: Domain, code and messages in Portuguese; framework terms in English

- Status: Superseded
- Superseded by: ADR-0022
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: all

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: entities (`Produto`, `Marca`), functions (`listarProdutos`), messages and routes (`/produtos`, `/api/categorias`) in Portuguese.

## Problem
Which language for the domain?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Portuguese (current) | Ubiquitous language with the domain | Mixes with framework terms | — |
| B. English in the code | Common convention | Rewriting | — |

## Decision
Ratify A (it becomes Art. XIV.1 of the Constitution).

## Rationale
It is already consistent in the code.

## Consequences
Glossary in docs/product/glossary.md.

## Verification
Review.
