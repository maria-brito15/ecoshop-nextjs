# ADR-0004: 100% client-side UI consuming its own API via hooks with an in-memory cache

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: CAT, PROD, REF, PERF

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: all pages have `"use client"`; `lib/hooks/useFetch.ts` keeps a `Map` with a 30 s TTL and stale-while-revalidate; `useMutation.ts` invalidates by URL substring.

## Problem
How does the UI fetch data and keep it fresh?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Own hooks (current) | No dependency | Reimplements cache, deduplication and invalidation (fragile by substring) | — |
| B. TanStack Query / SWR | Cache, deduplication and invalidation ready-made | A new dependency | — |
| C. Server Components with Next's `fetch` | Less client JS, SEO | Rewriting pages | — |

## Decision
Keep A for now (historical). The definitive decision is pending (P07) for when the large pages are decomposed.

## Rationale
Inferred: it works and requires no dependency.

## Consequences
The client cache may show data up to 30 s old; substring invalidation is fragile. Affects: `lib/hooks/**`, pages.

## Verification
—
