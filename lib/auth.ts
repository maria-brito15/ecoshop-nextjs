// lib/auth.ts

import { SignJWT, jwtVerify } from "jose"; // biblioteca para criar e verificar JWT
import { NextRequest } from "next/server";

// converte a string do .env para Uint8Array, que é o formato que o jose espera
// se JWT_SECRET não existir no .env, secret será undefined e o jwt vai falhar ao assinar
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// gera um token JWT com os dados do usuário
// chamado no login, após validar email e senha no banco
export async function signToken(payload: {
  id: number;
  email: string;
  tipo: string; // ex: "admin", "cliente"
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" }) // algoritmo de assinatura: HMAC com SHA-256
    .setExpirationTime("7d") // token expira em 7 dias
    .sign(secret); // assina com o secret do .env
}

// verifica se um token é válido e retorna os dados do usuário contidos nele
// retorna null se o token for inválido, adulterado ou expirado
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret); // lança exceção se inválido
    return payload as { id: number; email: string; tipo: string };
  } catch {
    return null; // qualquer erro (expirado, assinatura errada, etc.) vira null
  }
}

// lê o token do cookie da requisição e retorna a sessão do usuário
// usada nas rotas de API e no middleware para saber quem está logado
export async function getSession(req: NextRequest) {
  const token = req.cookies.get("token")?.value; // pega o cookie chamado "token"
  if (!token) return null; // sem cookie = não autenticado
  return verifyToken(token); // valida e retorna os dados do usuário
}
