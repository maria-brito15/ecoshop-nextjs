// lib/auth/index.ts

/**
 * ============================================================================
 * AUTH MODULE EXPORTS
 * ============================================================================
 * Ponto de entrada centralizado para todas as funcionalidades de autenticação.
 *
 * Este módulo exporta:
 * - Funções de alto nível para sign/verify de tokens
 * - Funções para obter sessão (request ou cookies)
 * - Função para definir cookie de autenticação
 * - Tipos relacionados (JwtPayload)
 *
 * Uso típico em API Routes:
 * ```ts
 * import { getSession, signToken, setAuthCookie } from "@/lib/auth";
 *
 * const session = await getSession(req);
 * if (!session) return ERROS.naoAutorizado();
 *
 * const token = await signToken({ id: usuario.id, email, tipo });
 * setAuthCookie(res, token);
 * ```
 *
 * Uso típico em middleware:
 * ```ts
 * import { getSession } from "@/lib/auth";
 *
 * const session = await getSession(req);
 * ```
 * ============================================================================
 */

import { NextRequest } from "next/server";
import { jwtService } from "./jwt";
import type { JwtPayload } from "@/types/auth";

// Funções principais de token (wrappers do jwtService)
export const signToken = (payload: JwtPayload) => jwtService.sign(payload);
export const verifyToken = (token: string) => jwtService.verify(token);

// Funções de sessão a partir de requisição ou cookies
export const getSession = (req: NextRequest) => jwtService.getSession(req);
export const getSessionFromCookies = () => jwtService.getSessionFromCookies();

// Função para definir cookie de autenticação na resposta
export const setAuthCookie = (res: any, token: string) =>
  jwtService.setAuthCookie(res, token);

// Re-exporta o tipo JwtPayload para conveniência
export type { JwtPayload } from "@/types/auth";
