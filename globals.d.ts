// globals.d.ts
// Permite que o TypeScript aceite imports de arquivos CSS sem erros (TS2882).
// O Next.js processa esses arquivos corretamente em runtime.
declare module "*.css";
