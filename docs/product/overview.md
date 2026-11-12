# EcoShop — product vision

> Source: original README (intent), the code and Arthur's answers on 2026-11-10. Where there is doubt, it is marked as an **open question**.

## What it is
A **storefront of sustainable products** with educational tools: the visitor browses the catalog, learns about each product's certifications and uses the AI to find out how to dispose of a waste item correctly (EcoScan) and to ask questions (chat). Administrators maintain the catalog.

**It is not (by the owner's decision, 2026-11-10):** an e-commerce. **Out of scope:** cart, order, payment, stock, delivery.

## Problem
People want to consume and dispose with less environmental impact, but do not know which products are trustworthy (certifications) or how to dispose of each material.

## Audience and roles
| Role | Who | Can |
|---|---|---|
| Visitor | Anyone | See the catalog, product, education, about; sign up; sign in |
| CLIENTE | Registered user | Besides the visitor: EcoScan, AI chat, see/edit their own profile |
| MARCA | Represents a brand | **Being defined.** Can be chosen at sign-up **subject to approval by an ADMIN** (not implemented yet: today sign-up creates MARCA directly). What MARCA can do beyond CLIENTE: open question |
| ADMIN | The EcoShop team | Everything, including managing products, categories, brands, certificates, photos and users |

## Capabilities
See `docs/capabilities/README.md`.

## Open questions
1. What can a MARCA user do? (manage their own products? only be displayed?)
2. Real source for the home page metrics and the per-product "impact" (illustrative today; the owner wants real sources).
3. Which materials the Azure Custom Vision model recognizes (few tags today, undocumented).
4. Should the Education content be editable by the admin or stay in the code?
