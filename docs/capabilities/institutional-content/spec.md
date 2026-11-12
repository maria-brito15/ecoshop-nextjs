# CONT · Institutional and educational content

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0023 (supersedes ADR-0022)

## Goal

Present the brand, the mission and educational content about sustainability.

## Actors

Visitor and users.

## Business rules

- **BR-CONT-01** — No number or data shown may be invented without a source (Constitution, Art. XI).

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-CONT-01 | When a visitor opens the home page, the system shall show the EcoShop presentation and access to the catalog. | Home renders with a link to /products |
| REQ-CONT-02 | When the home page shows metrics without a real source, the system shall label them as illustrative, visibly next to the number. | The home page shows "Illustrative numbers — no real data source yet" next to the metrics |
| REQ-CONT-03 | When a visitor opens the education area, the system shall show the educational content. | /education renders the content |
| REQ-CONT-04 | When a visitor opens the About page, the system shall show the team and the mission. | /about renders |
| REQ-CONT-05 | When a product shows a computed (not registered) environmental impact, the system shall label it as an illustrative estimate, visibly next to the number. | The product page shows "Illustrative estimate calculated from the price" next to the impact card |

## Edge cases

Static content; no access rules.

## Interfaces

Pages /, /education, /about.

## Applicable NFRs

NFR-ACE-01.

## Out of scope

CMS; blog.

## Open questions

1. Which real source will feed the home page metrics and the per-product impact? Decided for now (2026-11-10, owner's answer): none; the numbers stay illustrative, but visibly labeled as such (REQ-CONT-02, REQ-CONT-05). Backlog for a real source in `docs/architecture/adr/pending.md`.
