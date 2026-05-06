// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// rotas que só usuários com tipo "ADMIN" podem acessar
const ROTAS_ADMIN = ["/painel", "/api/admin"];

// rotas que qualquer usuário logado pode acessar
const ROTAS_AUTENTICADAS = ["/ia-scan", "/perfil"];

// rotas de API que exigem login (mas não necessariamente admin)
const ROTAS_API_AUTENTICADAS = ["/api/usuarios", "/api/produtos/fotos"];

// o middleware roda antes de cada requisição, interceptando o acesso às rotas
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl; // caminho da URL atual, ex: "/painel"

  // tenta pegar e verificar o token do cookie
  // se o token for inválido ou não existir, payload será null
  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  // verifica em qual categoria a rota atual se enquadra
  const isRotaAdmin = ROTAS_ADMIN.some((r) => pathname.startsWith(r));
  const isRotaAutenticada = ROTAS_AUTENTICADAS.some((r) =>
    pathname.startsWith(r),
  );
  const isRotaApiAutenticada = ROTAS_API_AUTENTICADAS.some((r) =>
    pathname.startsWith(r),
  );

  // true se a rota exige qualquer tipo de login
  const precisaLogin = isRotaAdmin || isRotaAutenticada || isRotaApiAutenticada;

  // usuário não autenticado tentando acessar rota protegida
  if (!payload && precisaLogin) {
    if (pathname.startsWith("/api/")) {
      // rotas de API retornam JSON com 401 (padrão REST)
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    // páginas redirecionam para o login
    // o parâmetro "next" guarda a rota original para redirecionar de volta após o login
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("next", pathname);

    return NextResponse.redirect(url);
  }

  // usuário logado mas sem permissão de admin tentando acessar rota restrita
  if (payload && isRotaAdmin && payload.tipo !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      // 403 = autenticado, mas sem permissão (diferente do 401 = não autenticado)
      return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/", req.url)); // redireciona para a home
  }

  // tudo certo: deixa a requisição continuar normalmente
  return NextResponse.next();
}

// define em quais rotas o middleware vai rodar
// sem isso, ele rodaria em TODAS as requisições (incluindo imagens, css, etc.)
export const config = {
  matcher: [
    "/painel/:path*", // todas as sub-rotas do painel admin
    "/perfil/:path*", // perfil do usuário
    "/ia-scan/:path*", // funcionalidade de scan com IA
    "/api/admin/:path*", // API do admin
    "/api/usuarios/:path*", // API de usuários
    "/api/produtos/:path*/fotos", // upload de fotos de produtos
  ],
};
