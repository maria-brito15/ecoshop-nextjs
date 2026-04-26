// hooks/useAuth.ts

import { useMutation } from "./useMutation";
import type { LoginBody, LoginResponse, OkResponse } from "@/types/api";
import type { RegistroBody, RegistroResponse } from "@/types/api";

export function useLogin() {
  return useMutation<LoginResponse, LoginBody>({ method: "POST" });
}

export function useLogout() {
  return useMutation<OkResponse>({ method: "DELETE" });
}

export function useRegistro() {
  return useMutation<RegistroResponse, RegistroBody>({ method: "POST" });
}
