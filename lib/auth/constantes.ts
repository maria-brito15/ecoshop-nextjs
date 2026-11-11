// lib/auth/constantes.ts

/**
 * Constantes da sessão (ADR-0021). Sem dependências de Node: o middleware (runtime
 * edge) também importa este arquivo.
 *
 * Sessão = token de ACESSO curto (JWT, cookie `token`) + token de RENOVAÇÃO opaco
 * guardado no Redis (cookie `refresh`), que pode ser revogado.
 */

/** Cookie com o JWT de acesso. */
export const ACCESS_COOKIE = "token";

/** Cookie com o token de renovação (valor opaco; a prova de validade está no Redis). */
export const REFRESH_COOKIE = "refresh";

/**
 * Duração do token de acesso. Curta de propósito: é o intervalo máximo em que um
 * acesso revogado continua valendo, já que o JWT é verificado sem consultar o
 * Redis. Valor inicial escolhido pela spec 010, sem medição de uso ❔.
 */
export const ACCESS_TOKEN_SECONDS = 15 * 60;

/** Duração máxima de uma sessão sem novo login (mantém os 7 dias do ADR-0007). */
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;
