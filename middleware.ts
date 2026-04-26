import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const ROTAS_ADMIN = ["/painel", "/api/admin", "/api/produtos/fotos"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const isRotaAdmin = ROTAS_ADMIN.some((r) => pathname.startsWith(r));
  if (isRotaAdmin && payload.tipo !== "ADMIN") {
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
    "/api/admin/:path*",
    "/api/usuarios/:path*",
    "/api/produtos/:path*/fotos",
    "/ia-scan/:path*",
  ],
};
