// lib/api.ts

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
}
