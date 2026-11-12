// lib/hooks/useAuth.ts

/**
 * AUTH HOOKS
 *
 * Specialized hooks for user authentication.
 *
 * They use the generic useMutation under the hood for:
 * - Login: POST /api/auth
 * - Logout: DELETE /api/auth
 * - Public registration: POST /api/users
 *
 * Why separate hooks?
 * - Specific typing for each operation
 * - Centralizes the auth endpoint URLs
 * - Easier maintenance (change a URL in a single place)
 *
 * IMPORTANT:
 * - The JWT is stored in an httpOnly cookie (managed automatically)
 * - The hooks do not need to handle the token manually
 * - The cookie is sent automatically via credentials: "include"
 */

import { useMutation } from "./useMutation";
import type {
  LoginBody,
  LoginResponse,
  OkResponse,
  RegistrationBody,
  RegistrationResponse,
} from "@/types/api";

/**
 * Hook for user login.
 *
 * Sends email and password to /api/auth.
 * On success, the httpOnly cookie with the JWT is set automatically.
 *
 * @returns Typed mutation hook for login
 *
 * @example
 * const login = useLogin();
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   const result = await login.execute("/api/auth", { email, password });
 *   if (result) router.push("/");
 * };
 */
export function useLogin() {
  return useMutation<LoginResponse, LoginBody>({ method: "POST" });
}

/**
 * Hook for user logout.
 *
 * Calls DELETE /api/auth, which removes the authentication cookie.
 *
 * @returns Typed mutation hook for logout
 *
 * @example
 * const logout = useLogout();
 *
 * const handleLogout = async () => {
 *   await logout.execute("/api/auth");
 *   router.push("/sign-in");
 * };
 */
export function useLogout() {
  return useMutation<OkResponse>({ method: "DELETE" });
}

/**
 * Hook for public registration of new users.
 *
 * Sends data to /api/users.
 * On success, the user is logged in automatically (JWT cookie set).
 *
 * @returns Typed mutation hook for registration
 *
 * @example
 * const registration = useRegistration();
 *
 * const handleRegister = async (data) => {
 *   const result = await registration.execute("/api/users", data);
 *   if (result) router.push("/");
 * };
 */
export function useRegistration() {
  return useMutation<RegistrationResponse, RegistrationBody>({ method: "POST" });
}
