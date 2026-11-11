// app/components/ChatFlutuante.tsx

/**
 * ============================================================================
 * CHAT DE SUSTENTABILIDADE (botão flutuante)
 * ============================================================================
 * REQ-CHAT-06: interface de chat para o usuário autenticado conversar com o
 * assistente de sustentabilidade (Gemini, via POST /api/ia/chat).
 *
 * Decisão do dono (2026-11-10): botão flutuante, visível em qualquer página,
 * em vez de uma rota própria. O histórico da conversa não é persistido no
 * servidor (REQ-CHAT: "casos-limite"); fica só neste componente e se perde
 * ao recarregar a página.
 *
 * Só aparece para quem está autenticado (a API exige sessão — REQ-CHAT-07).
 * ============================================================================
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/hooks/useIA";
import { fetchSession } from "@/lib/hooks/sessao";

type Message = { role: "user" | "model"; texto: string };

export default function FloatingChat() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const chat = useChat();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession().then((user) => setLoggedIn(user !== null));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, chat.carregando]);

  if (!loggedIn) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || chat.carregando) return;

    const history = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.texto }],
    }));

    setMessages((prev) => [...prev, { role: "user", texto: message }]);
    setText("");

    const result = await chat.executar("/api/ia/chat", {
      mensagem: message,
      historico: history,
    });
    if (result) {
      setMessages((prev) => [
        ...prev,
        { role: "model", texto: result.resposta },
      ]);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 h-[28rem] rounded-2xl flex flex-col overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "var(--color-primary)",
              color: "white",
            }}
          >
            <span className="font-semibold text-sm">
              🌿 Chat de Sustentabilidade
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="text-white/80 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
          >
            {messages.length === 0 && (
              <p
                className="text-sm text-center mt-8"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Pergunte sobre reciclagem, descarte correto ou alternativas
                sustentáveis.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "self-end" : "self-start"
                }`}
                style={
                  m.role === "user"
                    ? { background: "var(--color-primary)", color: "white" }
                    : {
                        background: "var(--color-bg-surface-hover)",
                        color: "var(--color-text-primary)",
                      }
                }
              >
                {m.texto}
              </div>
            ))}
            {chat.carregando && (
              <div
                className="self-start text-sm px-3 py-2"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Digitando…
              </div>
            )}
            {chat.erro && (
              <div className="self-stretch text-xs text-center text-red-600">
                {chat.erro}
              </div>
            )}
          </div>

          <form
            onSubmit={submit}
            className="flex items-center gap-2 px-3 py-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua pergunta..."
              maxLength={2000}
              disabled={chat.carregando}
              className="flex-1 px-3 py-2 rounded-full text-sm border focus:outline-none"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg-surface-hover)",
                color: "var(--color-text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={chat.carregando || !text.trim()}
              aria-label="Enviar mensagem"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chat" : "Abrir chat de sustentabilidade"}
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white transition-transform hover:scale-105"
        style={{
          background: "var(--color-primary)",
          boxShadow: "0 8px 24px rgba(45,149,105,0.4)",
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
