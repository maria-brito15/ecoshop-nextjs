// lib/hooks/useAuth.ts

/**
 * ============================================================================
 * AUTH HOOKS
 * ============================================================================
 * Hooks especializados para autenticação de usuários.
 *
 * Utilizam o useMutation genérico por baixo dos panos para:
 * - Login: POST /api/auth
 * - Logout: DELETE /api/auth
 * - Registro público: POST /api/users
 *
 * Por que hooks separados?
 * - Tipagem específica para cada operação
 * - Centraliza URLs dos endpoints de auth
 * - Facilita manutenção (mudar URL em um único lugar)
 *
 * IMPORTANTE:
 * - O token JWT é armazenado em cookie httpOnly (gerenciado automaticamente)
 * - Os hooks não precisam manipular o token manualmente
 * - O cookie é enviado automaticamente via credentials: "include"
 * ============================================================================
 */

import { useMutation } from "./useMutation";
import type {
  LoginBody,
  LoginResponse,
  OkResponse,
  RegistroBody,
  RegistroResponse,
} from "@/types/api";

/**
 * Hook para login de usuário.
 *
 * Envia email e senha para /api/auth.
 * Em caso de sucesso, o cookie httpOnly com o JWT é setado automaticamente.
 *
 * @returns Mutation hook tipado para login
 *
 * @example
 * const login = useLogin();
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   const result = await login.executar("/api/auth", { email, senha });
 *   if (result) router.push("/");
 * };
 */
export function useLogin() {
  return useMutation<LoginResponse, LoginBody>({ method: "POST" });
}

/**
 * Hook para logout de usuário.
 *
 * Chama DELETE /api/auth que remove o cookie de autenticação.
 *
 * @returns Mutation hook tipado para logout
 *
 * @example
 * const logout = useLogout();
 *
 * const handleLogout = async () => {
 *   await logout.executar("/api/auth");
 *   router.push("/sign-in");
 * };
 */
export function useLogout() {
  return useMutation<OkResponse>({ method: "DELETE" });
}

/**
 * Hook para registro público de novos usuários.
 *
 * Envia dados para /api/users.
 * Em caso de sucesso, o usuário é automaticamente logado (cookie JWT setado).
 *
 * @returns Mutation hook tipado para registro
 *
 * @example
 * const registro = useRegistro();
 *
 * const handleRegister = async (dados) => {
 *   const result = await registro.executar("/api/users", dados);
 *   if (result) router.push("/");
 * };
 */
export function useRegistro() {
  return useMutation<RegistroResponse, RegistroBody>({ method: "POST" });
}
