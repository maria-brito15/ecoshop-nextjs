// lib/auth/jwt.ts

/**
 * ============================================================================
 * JWT SERVICE
 * ============================================================================
 * Implementação completa de autenticação JWT (JSON Web Tokens).
 *
 * Características:
 * - Tokens assinados com HS256 (HMAC-SHA256)
 * - Token de ACESSO curto (15 min); a renovação usa um token opaco revogável (ADR-0021)
 * - Cookies httpOnly (mais seguros que localStorage)
 * - Singleton pattern: uma instância reutilizada globalmente
 *
 * Segurança:
 * - Tokens são assinados com JWT_SECRET (variável de ambiente)
 * - Cookies httpOnly: inacessíveis via JavaScript (mitiga XSS)
 * - secure: true em produção (só envia via HTTPS)
 * - sameSite: "lax" (protege contra CSRF em métodos seguros)
 *
 * Variável de ambiente necessária:
 * - JWT_SECRET: chave secreta para assinatura dos tokens (mínimo 32 caracteres)
 * ============================================================================
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  COOKIE_ACESSO,
  COOKIE_RENOVACAO,
  TEMPO_DO_ACESSO_SEGUNDOS,
  TEMPO_DA_RENOVACAO_SEGUNDOS,
} from "./constantes";
import type {
  JwtPayload,
  TokenEmissor,
  TokenVerificador,
  LeitorSessao,
} from "@/types/auth";

/**
 * Recupera a chave secreta do ambiente e converte para Uint8Array.
 *
 * Formato esperado pela biblioteca jose:
 * - TextEncoder().encode() converte string para bytes UTF-8
 *
 * @returns Chave secreta como Uint8Array
 * @throws Error se JWT_SECRET não estiver configurada
 */
function getSecret(): Uint8Array {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error(
      "[lib/auth] JWT_SECRET não definido. Configure a variável de ambiente.",
    );
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Serviço de JWT que implementa as três interfaces de autenticação.
 *
 * Responsabilidades:
 * - sign: criar tokens assinados
 * - verify: validar tokens e extrair payload
 * - getSession: extrair sessão de requisições Next.js
 * - setAuthCookie: definir cookie de autenticação na resposta
 */
export class JwtService
  implements TokenEmissor, TokenVerificador, LeitorSessao
{
  /**
   * Gera um novo token JWT.
   *
   * Algoritmo: HS256 (HMAC com SHA-256)
   * Expiração: TEMPO_DO_ACESSO_SEGUNDOS (15 minutos)
   *
   * @param payload - Dados a serem codificados no token
   * @returns Token JWT compacto (string)
   *
   * @example
   * const token = await jwtService.sign({ id: 1, email: "admin@ecoshop.com", tipo: "ADMIN" });
   */
  async sign(payload: JwtPayload): Promise<string> {
    return new SignJWT(payload as unknown as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${TEMPO_DO_ACESSO_SEGUNDOS}s`)
      .sign(getSecret());
  }

  /**
   * Valida um token JWT e retorna o payload.
   *
   * Validações realizadas automaticamente pelo jose:
   * - Assinatura (token não foi adulterado)
   * - Expiração (token ainda é válido)
   * - Formato (estrutura JWT válida)
   *
   * Validações adicionais:
   * - Verifica se os campos obrigatórios (id, email, tipo) estão presentes
   *
   * @param token - Token JWT a ser validado
   * @returns Payload decodificado ou null se inválido
   */
  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const typedPayload = payload as unknown as JwtPayload;

      // Validação adicional: campos obrigatórios devem existir
      if (typedPayload.id && typedPayload.email && typedPayload.tipo) {
        return typedPayload;
      }
      return null;
    } catch {
      // Qualquer erro (assinatura inválida, token expirado, malformado)
      return null;
    }
  }

  /**
   * Extrai a sessão do usuário a partir da requisição Next.js.
   *
   * Fluxo:
   * 1. Lê o cookie "token" da requisição
   * 2. Se não existir → retorna null
   * 3. Valida o token com verify()
   * 4. Retorna o payload ou null
   *
   * Usado em:
   * - Middleware (proteção de rotas)
   * - API Routes (autenticação)
   *
   * @param req - Requisição Next.js contendo os cookies
   * @returns Payload do usuário autenticado ou null
   */
  async getSession(req: NextRequest): Promise<JwtPayload | null> {
    const token = req.cookies.get(COOKIE_ACESSO)?.value;
    if (!token) return null;
    return this.verify(token);
  }

  /**
   * Extrai a sessão do usuário a partir dos cookies (em Server Components).
   *
   * Alternativa ao getSession para uso em Server Components do Next.js
   * (que não têm acesso direto ao objeto Request).
   *
   * @returns Payload do usuário autenticado ou null
   */
  async getSessionFromCookies(): Promise<JwtPayload | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_ACESSO)?.value;
      if (!token) return null;
      return this.verify(token);
    } catch {
      return null;
    }
  }

  /**
   * Define o cookie de autenticação na resposta HTTP.
   *
   * Configurações de segurança:
   * - httpOnly: true → inacessível via JavaScript (mitiga XSS)
   * - secure: true em produção → só envia via HTTPS
   * - sameSite: "lax" → protege contra CSRF em métodos seguros
   * - maxAge: igual à duração do token de acesso
   * - path: "/" → cookie disponível em toda aplicação
   *
   * @param res - Resposta Next.js
   * @param token - Token JWT a ser armazenado
   */
  setAuthCookie(res: NextResponse, token: string): void {
    res.cookies.set(COOKIE_ACESSO, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TEMPO_DO_ACESSO_SEGUNDOS,
      path: "/",
    });
  }

  /**
   * Define o cookie do token de renovação (opaco). Mesmas proteções do cookie de
   * acesso; `path: "/"` porque o middleware precisa saber que ele existe para
   * renovar o acesso expirado em navegações de página (ADR-0021).
   */
  setRefreshCookie(res: NextResponse, token: string): void {
    res.cookies.set(COOKIE_RENOVACAO, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TEMPO_DA_RENOVACAO_SEGUNDOS,
      path: "/",
    });
  }

  /** Remove os dois cookies da sessão (logout, renovação recusada). */
  clearSessionCookies(res: NextResponse): void {
    res.cookies.delete(COOKIE_ACESSO);
    res.cookies.delete(COOKIE_RENOVACAO);
  }
}

/**
 * Instância singleton do serviço JWT.
 * Reutilizada em toda aplicação para consistência.
 */
export const jwtService = new JwtService();
