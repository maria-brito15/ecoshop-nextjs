// eslint.config.mjs
// ESLint 9 (flat config). Replaces `next lint`, deprecated in Next 15 (ADR-0015).
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      "prisma/migrations/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Constitution, Art. V: Route Handlers and pages do not access Prisma directly.
    // The handlers were migrated to services (spec 012): the rule is now "error".
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db",
              message:
                "Constitution Art. V: access the database through a service in services/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Debt that exists in the baseline (docs/discovery): reported as a warning so the CI
    // does not block without a mass refactor. Each rule goes back to "error" when the
    // occurrence is fixed by a change spec. NEW code must be clean.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default config;
