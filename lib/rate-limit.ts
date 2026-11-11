// lib/rate-limit.ts

/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 * Limita tentativas por identificador (IP, usuário) numa janela de tempo.
 *
 * - Contagem no Redis, de forma ATÔMICA (REQ-OPS-15): `SET chave 0 EX janela NX`
 *   seguido de `INCR` numa transação. O TTL nasce junto com a chave; antes, um
 *   `INCR` e um `EXPIRE` separados deixavam a chave sem validade se o processo
 *   caísse entre os dois, bloqueando o identificador para sempre.
 * - Sem Redis (ADR-0020, decisão do dono): usa um contador EM MEMÓRIA do próprio
 *   processo. O limite vale por instância (com várias instâncias, cada uma conta
 *   separado) e é perdido ao reiniciar — melhor que liberar tudo.
 * - IP do cliente (REQ-OPS-16): `x-forwarded-for` só é confiável a partir do
 *   proxy reverso; o primeiro valor é escrito pelo cliente e pode ser forjado.
 *   Pega-se o valor na posição indicada por `TRUST_PROXY_HOPS` (padrão 1).
 * ============================================================================
 */

import { redis, comPrazo, TIMEOUT_COMANDO_MS, avisarFalhaDoRedis } from "@/lib/redis";

export interface RateLimitConfig {
  limite: number;
  janelaSegundos: number;
}

/** Conta ocorrências de uma chave dentro de uma janela. */
export interface ContadorDeJanela {
  /** Soma 1 à chave e devolve o total na janela atual. */
  incrementar(chave: string, janelaSegundos: number): Promise<number>;
}

class ContadorRedis implements ContadorDeJanela {
  async incrementar(chave: string, janelaSegundos: number): Promise<number> {
    const resposta = (await comPrazo(
      redis
        .multi()
        .set(chave, 0, { EX: janelaSegundos, NX: true })
        .incr(chave)
        .exec(),
      TIMEOUT_COMANDO_MS,
    )) as unknown[];
    const total = Number(resposta[1]);
    if (!Number.isFinite(total)) throw new Error("resposta inesperada do Redis");
    return total;
  }
}

/** Contador local do processo (reserva quando o Redis falha). */
export class ContadorEmMemoria implements ContadorDeJanela {
  private readonly entradas = new Map<string, { total: number; expiraEm: number }>();

  constructor(private readonly agora: () => number = Date.now) {}

  async incrementar(chave: string, janelaSegundos: number): Promise<number> {
    const t = this.agora();
    this.limparExpiradas(t);
    const atual = this.entradas.get(chave);
    if (!atual || atual.expiraEm <= t) {
      this.entradas.set(chave, { total: 1, expiraEm: t + janelaSegundos * 1000 });
      return 1;
    }
    atual.total += 1;
    return atual.total;
  }

  /** Só varre quando o mapa cresce, para não custar nada no caso comum. */
  private limparExpiradas(t: number) {
    if (this.entradas.size < 1000) return;
    for (const [chave, e] of this.entradas) if (e.expiraEm <= t) this.entradas.delete(chave);
  }
}

const contadorRedis = new ContadorRedis();
const contadorLocal = new ContadorEmMemoria();

/**
 * Registra uma tentativa e informa se o identificador passou do limite.
 *
 * @param contador - Contador principal (padrão: Redis)
 * @param reserva - Usado quando o principal falha (padrão: memória local)
 */
export async function rateLimit(
  identificador: string,
  config: RateLimitConfig,
  contador: ContadorDeJanela = contadorRedis,
  reserva: ContadorDeJanela = contadorLocal,
): Promise<{ bloqueado: boolean; tentativasRestantes: number }> {
  const chave = `rate_limit:${identificador}`;

  let tentativas: number;
  try {
    tentativas = await contador.incrementar(chave, config.janelaSegundos);
  } catch (err) {
    avisarFalhaDoRedis("rate_limit.redis_indisponivel_usando_memoria_local", err);
    tentativas = await reserva.incrementar(chave, config.janelaSegundos);
  }

  return {
    bloqueado: tentativas > config.limite,
    tentativasRestantes: Math.max(0, config.limite - tentativas),
  };
}

/**
 * Quantos proxies confiáveis existem à frente da aplicação (variável
 * `TRUST_PROXY_HOPS`; padrão 1: um proxy reverso, como no compose de publicação).
 */
function saltosDeProxy(): number {
  const valor = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(valor) && valor >= 0 ? valor : 1;
}

/**
 * IP do cliente para rate limit.
 *
 * Com N proxies confiáveis, o IP real é a N-ésima entrada contada do FIM de
 * `x-forwarded-for` (cada proxy acrescenta a que viu); entradas anteriores são do
 * cliente e podem ser forjadas. Com 0 proxies o cabeçalho é ignorado (todos caem
 * no mesmo balde "unknown": mais restritivo, porém não burlável).
 */
export function getClientIp(
  req: Request,
  saltos: number = saltosDeProxy(),
): string {
  if (saltos === 0) return "unknown";
  const entradas = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (entradas.length > 0) {
    return entradas[Math.max(0, entradas.length - saltos)];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
