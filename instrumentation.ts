// instrumentation.ts

/**
 * Run once by Next when the server starts (REQ-OPS-06).
 *
 * In production, refuses to start without a strong `JWT_SECRET` (Constitution, Art. XII.1).
 * The code that uses Node APIs lives in a module loaded only in the `nodejs` runtime,
 * so it does not enter the edge runtime bundle (where only the middleware runs).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const config = await import("@/lib/config/verify-environment");
  config.requireProductionEnvironment();
}
