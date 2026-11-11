// config/rotas-protegidas.ts

/**
 * ============================================================================
 * ROTAS PROTEGIDAS - CONFIGURAÇÃO
 * ============================================================================
 * Este arquivo define as regras de proteção de rotas da aplicação.
 *
 * As regras são consumidas pelo middleware (middleware.ts) para:
 * - Redirecionar usuários não autenticados para /sign-in
 * - Bloquear acesso de usuários sem permissão (admin vs. autenticado comum)
 * - Diferenciar entre respostas API (JSON) e páginas (redirect)
 *
 * Por que centralizar aqui?
 * - Manter as regras de segurança em um único local
 * - Facilitar manutenção e auditoria
 * - Evitar regras espalhadas pelo código
 *
 * Tipos de proteção:
 * - "admin": apenas usuários com tipo "ADMIN" podem acessar
 * - "autenticado": qualquer usuário logado (CLIENTE, MARCA, ADMIN) pode acessar
 *
 * Tipos de resposta:
 * - "api": retorna JSON com erro (ex: { erro: "Não autorizado" })
 * - "pagina": redireciona para /sign-in com parâmetro next
 * ============================================================================
 */

/**
 * Níveis de acesso disponíveis para proteção de rotas.
 *
 * - admin: Apenas usuários com tipo "ADMIN" têm permissão.
 *          Usado para rotas administrativas (painel, gerenciamento de usuários).
 *
 * - autenticado: Qualquer usuário logado (CLIENTE, MARCA ou ADMIN) tem permissão.
 *                Usado para rotas de perfil e funcionalidades pessoais.
 */
export type AccessLevel = "admin" | "autenticado";

/**
 * Regra de proteção para uma rota ou grupo de rotas.
 */
export interface RouteRule {
  /**
   * Prefixo da rota que será protegida.
   * O middleware verifica se a URL atual começa com este prefixo.
   *
   * @example
   * prefixo: "/perfil" → protege /perfil, /perfil/editar, /perfil/configuracoes
   * prefixo: "/api/admin" → protege /api/admin, /api/admin/usuarios, etc.
   */
  prefix: string;

  /**
   * Nível de acesso mínimo necessário.
   * - "admin": apenas ADMIN pode acessar
   * - "autenticado": qualquer usuário logado pode acessar
   */
  level: AccessLevel;

  /**
   * Tipo de resposta quando o acesso é negado.
   * - "api": retorna JSON com status 401/403 (para endpoints de API)
   * - "pagina": redireciona para página de login (para rotas de página)
   */
  responseType: "api" | "pagina";
}

/**
 * Lista de regras de proteção de rotas.
 * A ordem das regras NÃO importa porque o middleware verifica
 * se a URL COMEÇA com o prefixo (startsWith).
 *
 * IMPORTANTE: Regras mais específicas devem vir antes de regras genéricas
 * se houver sobreposição. Exemplo:
 * - "/api/admin/usuarios" antes de "/api/admin"
 *
 * Regras atuais:
 * 1. /perfil → autenticado (qualquer usuário logado pode ver seu perfil)
 * 2. /ia-scan → autenticado (REQ-AUTZ-08; a API /api/ia/scan já exigia login,
 *    mas a página abria para qualquer visitante antes de tentar enviar a foto)
 * 3. /painel → admin (apenas administradores acessam o painel)
 * 4. /api/usuarios → autenticado (o middleware só exige sessão; quem pode ler/editar cada
 *    registro é decidido no handler: o próprio usuário ou ADMIN, e só ADMIN lista, cria e exclui.
 *    Ver ADR-0017 e specs/001-perfil-proprio-usuario)
 * 5. /api/admin → admin (endpoints administrativos)
 */
export const ROUTE_RULES: RouteRule[] = [
  {
    prefix: "/perfil",
    level: "autenticado",
    responseType: "pagina",
  },
  {
    prefix: "/ia-scan",
    level: "autenticado",
    responseType: "pagina",
  },
  {
    prefix: "/painel",
    level: "admin",
    responseType: "pagina",
  },
  {
    prefix: "/api/usuarios",
    level: "autenticado", // o handler aplica "ADMIN ou o próprio" (ADR-0017)
    responseType: "api",
  },
  {
    prefix: "/api/admin",
    level: "admin",
    responseType: "api",
  },
];
