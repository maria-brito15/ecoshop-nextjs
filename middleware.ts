import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const ROTAS_ADMIN = ["/painel", "/api/admin"];

const ROTAS_AUTENTICADAS = ["/ia-scan", "/perfil"];

const ROTAS_API_AUTENTICADAS = ["/api/usuarios", "/api/produtos/fotos"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const isRotaAdmin = ROTAS_ADMIN.some((r) => pathname.startsWith(r));
  const isRotaAutenticada = ROTAS_AUTENTICADAS.some((r) =>
    pathname.startsWith(r),
  );
  const isRotaApiAutenticada = ROTAS_API_AUTENTICADAS.some((r) =>
    pathname.startsWith(r),
  );

  const precisaLogin = isRotaAdmin || isRotaAutenticada || isRotaApiAutenticada;

  if (!payload && precisaLogin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (payload && isRotaAdmin && payload.tipo !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/perfil/:path*",
    "/ia-scan/:path*",
    "/api/admin/:path*",
    "/api/usuarios/:path*",
    "/api/produtos/:path*/fotos",
  ],
};
