// lib/hooks/useIA.ts

import { useMutation } from "./useMutation";
import type { ChatBody, ChatResponse, ScanResponse } from "@/types/api";

export function useChat() {
  return useMutation<ChatResponse, ChatBody>({ method: "POST" });
}

export function useScan() {
  return useMutation<ScanResponse, FormData>({ method: "POST" });
}
