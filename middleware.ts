// middleware.ts

/**
 * ============================================================================
 * MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * ============================================================================
 * Este middleware é executado em TODAS as requisições antes de chegarem às rotas.
 *
 * Responsabilidades:
 * 1. Verificar autenticação do usuário via token JWT nos cookies
 * 2. Aplicar regras de proteção definidas em config/rotas-protegidas.ts
 * 3. Redirecionar usuários não autenticados para login (rotas de página)
 * 4. Retornar erro JSON para APIs quando acesso negado
 * 5. Verificar nível de acesso (admin vs. autenticado comum)
 *
 * Fluxo de execução:
 * 1. Extrai o token do cookie
 * 2. Valida o token e obtém payload (id, email, tipo)
 * 3. Verifica se a rota atual corresponde a alguma regra de proteção
 * 4. Se não há regra → permite acesso (NextResponse.next())
 * 5. Se há regra mas usuário não está autenticado → nega acesso
 * 6. Se há regra com nível "admin" e usuário não é ADMIN → nega acesso
 * 7. Caso contrário → permite acesso
 *
 * IMPORTANTE: O middleware roda no Edge Runtime (não no Node.js).
 * Por isso não podemos usar dependências Node.js (fs, path, etc.).
 *
 * @see config/rotas-protegidas.ts - Definição das regras de proteção
 * ============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { REGRAS_ROTAS } from "./config/rotas-protegidas";

/**
 * Middleware principal da aplicação.
 *
 * Executado para todas as requisições que correspondem ao matcher
 * definido na export const config.
 *
 * @param req - Requisição Next.js contendo URL, cookies, headers, etc.
 * @returns Resposta Next.js (próximo handler, redirect, ou erro JSON)
 *
 * @example
 * // Usuário não autenticado acessando /perfil
 * // Resultado: redirect para /sign-in?next=/perfil
 *
 * @example
 * // Usuário CLIENTE acessando /api/admin
 * // Resultado: { erro: "Acesso negado" } com status 403
 *
 * @example
 * // Usuário ADMIN acessando /painel
 * // Resultado: NextResponse.next() (acesso liberado)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Tenta extrair e validar o token JWT do cookie
  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  // Verifica se a rota atual corresponde a alguma regra de proteção
  const regra = REGRAS_ROTAS.find((r) => pathname.startsWith(r.prefixo));

  // Rota pública: nenhuma regra se aplica → acesso liberado
  if (!regra) return NextResponse.next();

  // CASO 1: Usuário NÃO está autenticado
  if (!payload) {
    // Para rotas de API: retorna JSON 401 (Unauthorized)
    if (regra.tipoResposta === "api") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }

    // Para rotas de página: redireciona para login
    // O parâmetro next permite redirecionar de volta após login bem-sucedido
    return NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  // CASO 2: Usuário autenticado mas nível de acesso insuficiente
  // Regra com nivel "admin" e usuário não é ADMIN
  if (regra.nivel === "admin" && payload.tipo !== "ADMIN") {
    // Para rotas de API: retorna JSON 403 (Forbidden)
    if (regra.tipoResposta === "api") {
      return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
    }

    // Para rotas de página: redireciona para home (não tem permissão)
    return NextResponse.redirect(new URL("/", req.url));
  }

  // CASO 3: Usuário autenticado E com permissão adequada
  // Acesso liberado para o próximo handler (rota da API ou página)
  return NextResponse.next();
}

/**
 * Configuração do matcher do middleware.
 *
 * Define quais rotas serão processadas pelo middleware.
 * Otimização importante: sem este matcher, o middleware rodaria para
 * TODAS as requisições (incluindo CSS, JS, imagens, etc.), impactando performance.
 *
 * Padrões suportados (glob patterns):
 * - /perfil/:path* → todas as rotas que começam com /perfil
 * - /painel/:path* → todas as rotas que começam com /painel
 * - /api/usuarios/:path* → todas as rotas que começam com /api/usuarios
 * - /api/admin/:path* → todas as rotas que começam com /api/admin
 *
 * Por que não usar REGRAS_ROTAS para gerar o matcher automaticamente?
 * - O matcher precisa ser estático (não pode depender de variáveis em runtime)
 * - O middleware.ts é compilado em build time, REGRAS_ROTAS é carregado em runtime
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    "/perfil/:path*",
    "/painel/:path*",
    "/api/usuarios/:path*",
    "/api/admin/:path*",
  ],
};
