// eslint.config.mjs
// ESLint 9 (flat config). Substitui `next lint`, depreciado no Next 15 (ADR-0015).
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
    // Constitution, Art. V: Route Handlers e páginas não acessam o Prisma direto.
    // Hoje há handlers que violam (débito registrado): por isso "warn" até a
    // spec de mudança que os migra para services; depois vira "error".
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/lib/db",
              message:
                "Art. V da Constitution: acesse o banco por um service em services/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Débito existente no baseline (docs/discovery): reportado como aviso para o CI
    // não bloquear sem refatoração em massa. Cada regra volta a "error" quando a
    // ocorrência for corrigida por uma spec de mudança. Código NOVO deve estar limpo.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default config;
