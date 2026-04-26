// lib/hooks/useCertificados.ts

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaCertificadosResponse,
  BuscarCertificadoResponse,
  CriarCertificadoBody,
  CriarCertificadoResponse,
  AtualizarCertificadoBody,
  AtualizarCertificadoResponse,
  OkResponse,
} from "@/types/api";

export function useListarCertificados() {
  return useFetch<ListaCertificadosResponse>("/api/certificados");
}

export function useBuscarCertificado(id: number | null) {
  return useFetch<BuscarCertificadoResponse>(
    id ? `/api/certificados/${id}` : null,
  );
}

export function useCriarCertificado() {
  return useMutation<CriarCertificadoResponse, CriarCertificadoBody>({
    method: "POST",
  });
}

export function useAtualizarCertificado() {
  return useMutation<AtualizarCertificadoResponse, AtualizarCertificadoBody>({
    method: "PUT",
  });
}

export function useDeletarCertificado() {
  return useMutation<OkResponse>({ method: "DELETE" });
}
