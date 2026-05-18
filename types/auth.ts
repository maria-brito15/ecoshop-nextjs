// types/auth.ts

/**
 * ============================================================================
 * AUTHENTICATION TYPES
 * ============================================================================
 * Este arquivo contém os tipos relacionados à autenticação e autorização
 * do EcoShop. Utiliza JWT (JSON Web Tokens) para gerenciar sessões
 * stateless com cookies httpOnly.
 *
 * Os tipos seguem o princípio de segregação de interfaces (ISP):
 * cada interface representa uma responsabilidade única do sistema de auth.
 * ============================================================================
 */

/**
 * Payload armazenado no JWT.
 * Este é o dado que será codificado no token e verificado em cada requisição.
 *
 * ATENÇÃO: Não incluir dados sensíveis ou muito volumosos no payload,
 * pois o token é transmitido em cada requisição HTTP.
 *
 * O token é configurado para expirar em 7 dias.
 */
export interface JwtPayload {
  /** ID único do usuário no banco de dados (chave primária auto-increment) */
  id: number;
  /** Email do usuário (único) — usado para identificar e exibir no frontend */
  email: string;
  /**
   * Tipo/permissão do usuário.
   * Determinante para o middleware de autorização:
   * - ADMIN → acesso liberado a rotas /api/admin e /painel
   * - MARCA → acesso restrito aos próprios produtos
   * - CLIENTE → acesso apenas a rotas públicas e perfil
   */
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
}

/**
 * Contrato para emissão (assinatura) de tokens JWT.
 * Implementado por JwtService em lib/auth/jwt.ts
 */
export interface TokenEmissor {
  /**
   * Gera um novo token JWT assinado com a chave secreta.
   * @param payload - Dados a serem codificados no token (id, email, tipo)
   * @returns Promise com o token string no formato JWT compacto
   * @throws Erro se JWT_SECRET não estiver configurado
   */
  sign(payload: JwtPayload): Promise<string>;
}

/**
 * Contrato para verificação de tokens JWT.
 * Implementado por JwtService em lib/auth/jwt.ts
 */
export interface TokenVerificador {
  /**
   * Verifica a validade e assinatura de um token JWT.
   * @param token - Token JWT a ser verificado
   * @returns Payload decodificado se token for válido, null caso contrário
   *
   * Motivos de falha:
   * - Token expirado (expiração padrão: 7 dias)
   * - Assinatura inválida (token adulterado)
   * - Token malformado
   * - Chave secreta incorreta
   */
  verify(token: string): Promise<JwtPayload | null>;
}

/**
 * Contrato para leitura de sessão a partir da requisição Next.js.
 * Utilizado por middlewares e rotas de API que precisam do usuário autenticado.
 */
export interface LeitorSessao {
  /**
   * Extrai o token do cookie 'token' da requisição e o valida.
   * @param req - Objeto NextRequest do App Router contendo os cookies
   * @returns Payload do usuário autenticado, ou null se:
   *          - Cookie não existe
   *          - Token é inválido
   *          - Token está expirado
   *
   * @example
   * const session = await getSession(req);
   * if (!session) return ERROS.naoAutorizado();
   * console.log(`Usuário ${session.email} está autenticado`);
   */
  getSession(
    req: import("next/server").NextRequest,
  ): Promise<JwtPayload | null>;
}
