// lib/rate-limit.ts

/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 * Este módulo implementa rate limiting baseado em Redis para prevenir abusos
 * em endpoints sensíveis (login, registro, etc.).
 *
 * Estratégia: Sliding Window Counter via Redis INCR + EXPIRE
 * - Cada requisição incrementa um contador no Redis
 * - O contador expira automaticamente após a janela configurada
 * - Se o limite for excedido, bloqueia requisições subsequentes
 *
 * Endpoints que utilizam rate limiting:
 * - POST /api/auth (login) → 10 tentativas por minuto
 * - POST /api/users (registro) → 5 tentativas por hora
 *
 * IMPORTANTE: O rate limiting é aplicado por IP para prevenir:
 * - Ataques de força bruta (brute force)
 * - Enumeração de usuários
 * - Exaustão de recursos do servidor
 * ============================================================================
 */

import { redis } from "@/lib/redis";

/**
 * Configuração do rate limit para um endpoint específico.
 */
export interface RateLimitConfig {
  /** Número máximo de tentativas permitidas dentro da janela */
  limite: number;
  /** Duração da janela de tempo em segundos */
  janelaSegundos: number;
}

/**
 * Verifica se uma requisição deve ser bloqueada por excesso de tentativas.
 *
 * Como funciona:
 * 1. Chave única é criada no formato `rate_limit:{identificador}`
 * 2. INCR incrementa o contador (cria chave com valor 1 se não existir)
 * 3. Se for a primeira tentativa (tentativas === 1), define EXPIRE
 * 4. Compara tentativas com limite configurado
 *
 * @param {string} identificador - Identificador único do cliente (geralmente IP)
 * @param {RateLimitConfig} config - Limite e janela de tempo
 * @returns {Promise<{ bloqueado: boolean; tentativasRestantes: number }>}
 *
 * @example
 * const { bloqueado } = await rateLimit(ip, { limite: 10, janelaSegundos: 60 });
 * if (bloqueado) return NextResponse.json({ erro: "Muitas tentativas" }, { status: 429 });
 */
export async function rateLimit(
  identificador: string,
  config: RateLimitConfig,
): Promise<{ bloqueado: boolean; tentativasRestantes: number }> {
  const chave = `rate_limit:${identificador}`;

  try {
    // Incrementa o contador atômico
    const tentativas = await redis.incr(chave);

    // Se é a primeira tentativa (contador acabou de ser criado),
    // define o TTL para a chave expirar automaticamente após a janela.
    if (tentativas === 1) {
      await redis.expire(chave, config.janelaSegundos);
    }

    const bloqueado = tentativas > config.limite;
    const tentativasRestantes = Math.max(0, config.limite - tentativas);

    return { bloqueado, tentativasRestantes };
  } catch {
    // Fallback em caso de falha do Redis:
    // Permite a requisição para não prejudicar a experiência do usuário.
    // O erro é silenciado, mas deve ser monitorado nos logs.
    return { bloqueado: false, tentativasRestantes: config.limite };
  }
}

/**
 * Extrai o endereço IP do cliente a partir dos headers da requisição.
 *
 * Ordem de verificação (mais confiável para menos):
 * 1. x-forwarded-for: header padrão quando a aplicação está atrás de proxy/load balancer
 *    (ex: Nginx, Cloudflare, Vercel, Render)
 * 2. x-real-ip: header alternativo configurado em alguns proxies
 * 3. "unknown" fallback para casos onde nenhum IP está disponível
 *
 * IMPORTANTE: Em produção atrás de proxy, o IP real está em x-forwarded-for,
 * não em socket remoto. Este header pode conter múltiplos IPs (forwarded chain),
 * então pegamos apenas o primeiro (mais próximo do cliente).
 *
 * @param {Request} req - Requisição Next.js (pode ser NextRequest ou Request padrão)
 * @returns {string} Endereço IP do cliente ou "unknown"
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
