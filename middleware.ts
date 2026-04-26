import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const ROTAS_PUBLICAS = [
  "/api/auth",
  "/api/produtos",
  "/api/categorias",
  "/api/marcas",
  "/api/certificados",
  "/login",
  "/",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  if (isPublica) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    (pathname.startsWith("/painel") || pathname.startsWith("/api/admin")) &&
    payload.tipo !== "ADMIN"
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/api/usuarios/:path*",
    "/api/admin/:path*",
    "/ia-scan/:path*",
  ],
};
