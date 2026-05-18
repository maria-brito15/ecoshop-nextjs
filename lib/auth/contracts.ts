// lib/auth/contracts.ts

/**
 * ============================================================================
 * AUTH CONTRACTS
 * ============================================================================
 * Este arquivo define as interfaces (contratos) para o sistema de autenticação.
 *
 * O padrão de interface permite:
 * - Múltiplas implementações (JWT, OAuth, sessão em banco)
 * - Testabilidade (mockar autenticação em testes)
 * - Desacoplamento de implementações concretas
 *
 * Implementação atual:
 * - JwtService (lib/auth/jwt.ts) implementa todas as interfaces
 *
 * Interfaces exportadas:
 * - JwtPayload: dados armazenados no token
 * - TokenEmissor: assinatura de tokens
 * - TokenVerificador: validação de tokens
 * - LeitorSessao: extração de sessão da requisição
 * ============================================================================
 */

// Importa os tipos do arquivo central de tipos
import type {
  JwtPayload,
  TokenEmissor,
  TokenVerificador,
  LeitorSessao,
} from "@/types/auth";

// Re-exporta todos os tipos para conveniência
export type { JwtPayload, TokenEmissor, TokenVerificador, LeitorSessao };
