// instrumentation.ts

/**
 * Executado pelo Next uma vez, quando o servidor inicia (REQ-OPS-06).
 *
 * Em produção, recusa iniciar sem um `JWT_SECRET` forte (Constitution, Art. XII.1).
 * O código que usa APIs de Node fica em módulo carregado só no runtime `nodejs`,
 * para não entrar no bundle do runtime edge (onde só roda o middleware).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const config = await import("@/lib/config/verificar-ambiente");
  config.requireProductionEnvironment();
}
