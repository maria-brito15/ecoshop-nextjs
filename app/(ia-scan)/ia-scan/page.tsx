// app/(ia-scan)/ia-scan/page.tsx

"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useScan } from "@/lib/hooks/useIA";
import type { ScanSucesso, ScanInsuficiente } from "@/types/api";

const VALID_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024;

interface ArquivoSelecionado {
  file: File;
  previewUrl: string;
  name: string;
  size: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const s = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function getConfidenceColors(conf: number) {
  if (conf >= 85) return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
  if (conf >= 70) return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
  return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
}

interface CardProps {
  icon: string;
  title: string;
  colorClass: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

function InfoCard({ icon, title, colorClass, children, fullWidth }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--color-bg-surface)]
        rounded-2xl p-8
        border border-[var(--color-border)]
        shadow-[0_2px_8px_rgba(26,58,46,0.06)]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[var(--shadow-card)]
        hover:border-[var(--color-primary)]
        ${fullWidth ? "col-span-full" : ""}
      `}
    >
      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--color-border)]">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colorClass}`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>
      <div className="text-[var(--color-text-secondary)] leading-relaxed text-[0.95rem]">
        {children}
      </div>
    </div>
  );
}

function TextoSust({ value }: { value: unknown }) {
  if (!value)
    return <p className="italic opacity-60">Informação não disponível.</p>;
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const paras = text.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className="mb-3 last:mb-0 leading-7">
          {p.split(/\n/).map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

function ResultadoSucesso({
  data,
  onReset,
}: {
  data: ScanSucesso;
  onReset: () => void;
}) {
  const a = data.analise_sustentabilidade;
  const conf = data.confianca;
  const colors = getConfidenceColors(conf);

  const materialFormatado = data.material
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return (
    <div
      className="mt-10 animate-[fadeSlideUp_0.6s_ease_forwards]"
      aria-live="polite"
    >
      <div className="text-center mb-12">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border"
          style={{
            background: colors.bg,
            color: colors.color,
            borderColor: colors.border,
          }}
        >
          ✅ Confiança: {conf.toFixed(1)}%
        </span>

        <h2 className="font-display text-5xl font-extrabold text-[var(--color-text-primary)] mb-2 leading-tight">
          {materialFormatado}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-base">
          Identificação concluída com sucesso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InfoCard
          icon="🌍"
          title="Impacto Ambiental"
          colorClass="bg-[var(--color-primary-light)] text-[var(--color-primary)]"
        >
          <TextoSust value={a.impacto_ambiental} />
        </InfoCard>

        <InfoCard
          icon="⏳"
          title="Decomposição"
          colorClass="bg-amber-50 text-amber-500 dark:bg-amber-500/15"
        >
          <TextoSust value={a.tempo_decomposicao} />
        </InfoCard>

        <InfoCard
          icon="🗑️"
          title="Como Descartar"
          colorClass="bg-blue-50 text-blue-500 dark:bg-blue-500/15"
        >
          <TextoSust value={a.onde_descartar} />
        </InfoCard>

        <InfoCard
          icon="♻️"
          title="Reciclabilidade"
          colorClass="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15"
        >
          <TextoSust value={a.reciclabilidade} />
        </InfoCard>

        <InfoCard
          icon="💡"
          title="Dicas Sustentáveis"
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-500/15"
          fullWidth
        >
          <TextoSust value={a.dicas_sustentaveis} />
        </InfoCard>

        <InfoCard
          icon="❤️"
          title="Por que reciclar este item?"
          colorClass="bg-red-50 text-red-500 dark:bg-red-500/15"
          fullWidth
        >
          <TextoSust value={a.beneficios_reciclagem} />
        </InfoCard>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <button
          onClick={onReset}
          className="
            inline-flex items-center gap-2
            px-8 py-3.5 rounded-full font-semibold text-sm
            bg-[var(--color-bg-surface)]
            border-2 border-[var(--color-border)]
            text-[var(--color-text-primary)]
            hover:border-[var(--color-primary)]
            hover:text-[var(--color-primary)]
            hover:-translate-y-0.5
            transition-all duration-200
          "
        >
          🔄 Analisar Outro Item
        </button>

        <Link
          href="/produtos"
          className="
            inline-flex items-center gap-2
            px-8 py-3.5 rounded-full font-semibold text-sm
            bg-[var(--color-primary)]
            text-white
            shadow-[var(--shadow-btn)]
            hover:bg-[var(--color-primary-hover)]
            hover:-translate-y-0.5
            hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)]
            transition-all duration-200
          "
        >
          🛍️ Ver Alternativas Sustentáveis
        </Link>
      </div>
    </div>
  );
}

function ResultadoInsuficiente({
  data,
  onReset,
}: {
  data: ScanInsuficiente;
  onReset: () => void;
}) {
  return (
    <div
      className="
        mt-10 p-8 rounded-2xl text-center
        bg-amber-50 border border-amber-200
        dark:bg-amber-500/10 dark:border-amber-500/30
        animate-[fadeSlideUp_0.6s_ease_forwards]
      "
      aria-live="polite"
    >
      <span className="text-5xl mb-4 block">🔍</span>
      <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-2">
        Não foi possível identificar com segurança
      </h3>
      <p className="text-amber-700 dark:text-amber-400 mb-4 max-w-md mx-auto">
        {data.mensagem}
      </p>
      <div className="inline-block bg-white dark:bg-white/10 rounded-xl px-6 py-3 mb-4 text-sm border border-amber-200 dark:border-amber-500/20">
        <span className="text-amber-600 dark:text-amber-400">
          Confiança obtida: <strong>{data.confianca.toFixed(1)}%</strong>{" "}
          (mínimo: {data.confianca_minima_requerida}%)
        </span>
      </div>
      <p className="text-amber-600 dark:text-amber-400 text-sm mb-6">
        💡 <strong>Dica:</strong> {data.sugestao}
      </p>
      <button
        onClick={onReset}
        className="
          inline-flex items-center gap-2
          px-8 py-3.5 rounded-full font-semibold text-sm
          bg-[var(--color-primary)] text-white
          shadow-[var(--shadow-btn)]
          hover:bg-[var(--color-primary-hover)]
          hover:-translate-y-0.5
          transition-all duration-200
        "
      >
        📷 Tentar Novamente
      </button>
    </div>
  );
}

export default function IaScanPage() {
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [dragover, setDragover] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, carregando, erro: erroHook, executar } = useScan();

  function validarArquivo(file: File): string | null {
    if (!VALID_TYPES.includes(file.type))
      return `Formato inválido. Use: JPG, PNG, GIF ou WebP`;
    if (file.size > MAX_SIZE) return `Arquivo muito grande. Máximo: 10 MB`;
    return null;
  }

  function selecionarArquivo(file: File) {
    const err = validarArquivo(file);
    if (err) {
      setErroLocal(err);
      return;
    }
    setErroLocal(null);
    setArquivo({
      file,
      previewUrl: URL.createObjectURL(file),
      name:
        file.name.length > 30
          ? file.name.slice(0, 27) + "..." + file.name.split(".").pop()
          : file.name,
      size: formatBytes(file.size),
    });
  }

  function resetar() {
    if (arquivo?.previewUrl) URL.revokeObjectURL(arquivo.previewUrl);
    setArquivo(null);
    setErroLocal(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function analisar() {
    if (!arquivo) return;
    const form = new FormData();
    form.append("image", arquivo.file);
    executar("/api/ia/scan", form);
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  }, []);
  const onDragLeave = useCallback(() => setDragover(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) selecionarArquivo(file);
  }, []);

  const mostrarResultado = !carregando && data;
  const sucesso = mostrarResultado && data.sucesso;
  const insuficiente = mostrarResultado && !data.sucesso;

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      <section
        className="
          text-center py-16 md:py-24
          bg-[var(--color-bg-body)]
          [background-image:radial-gradient(circle_at_50%_0%,rgba(45,149,105,0.06)_0%,transparent_50%)]
          border-b border-[var(--color-border)]
          mb-10
        "
      >
        <div className="container-eco">
          <span className="badge-eco mb-6 mx-auto">
            🤖 Inteligência Artificial
          </span>

          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-tight mb-4">
            EcoScan <span className="text-gradient-eco">IA</span>
          </h1>

          <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
            Use nossa tecnologia para identificar resíduos e descobrir o
            descarte correto em segundos.
          </p>
        </div>
      </section>

      <div className="container-eco pb-24">
        {(erroLocal || erroHook) && (
          <div
            className="
              flex items-start gap-4 p-5 rounded-xl mb-8
              bg-red-50 border border-red-200 text-red-800
              dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300
            "
            role="alert"
          >
            <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <strong className="block font-semibold mb-0.5">
                Ops! Algo deu errado.
              </strong>
              <span className="text-sm">{erroLocal ?? erroHook}</span>
            </div>
          </div>
        )}

        {!arquivo && !mostrarResultado && (
          <div
            className="
              max-w-2xl mx-auto
              bg-[var(--color-bg-surface)]
              rounded-2xl p-3
              border border-[var(--color-border)]
              shadow-[var(--shadow-card)]
            "
          >
            <div
              role="button"
              tabIndex={0}
              aria-label="Área de upload de imagem"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-4
                px-8 py-16 rounded-xl cursor-pointer
                border-2 border-dashed
                bg-[var(--color-bg-body)]
                transition-all duration-200
                outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
                ${
                  dragover
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] scale-[1.01]"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                }
              `}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) selecionarArquivo(f);
                }}
              />

              <div
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center
                  bg-[var(--color-bg-surface)] shadow-sm border border-[var(--color-border)]
                  text-4xl transition-transform duration-300
                  ${dragover ? "scale-110 -rotate-12" : "group-hover:scale-110"}
                `}
              >
                ☁️
              </div>

              <div className="text-center">
                <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-1">
                  Arraste uma foto ou clique para selecionar
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Suporta JPG, PNG, GIF, WebP &mdash; máx. 10 MB
                </p>
              </div>

              <span
                className="
                  px-6 py-2.5 rounded-full text-sm font-semibold
                  bg-[var(--color-bg-surface)] border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                  transition-colors pointer-events-none
                "
              >
                Selecionar Arquivo
              </span>
            </div>
          </div>
        )}

        {arquivo && !carregando && !mostrarResultado && (
          <div
            className="
              max-w-2xl mx-auto
              flex flex-col sm:flex-row items-center justify-between gap-6
              bg-[var(--color-bg-surface)]
              rounded-2xl p-6
              border border-[var(--color-border)]
              shadow-[var(--shadow-card)]
              animate-[fadeSlideUp_0.4s_ease]
            "
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg-body)]">
                <img
                  src={arquivo.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-[var(--color-text-primary)] text-base leading-snug max-w-[200px] truncate">
                  {arquivo.name}
                </p>
                <p className="text-sm text-[var(--color-primary)] font-medium mt-0.5 flex items-center gap-1.5">
                  <span>✅</span> Pronto para análise &bull; {arquivo.size}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={resetar}
                className="
                  flex-1 sm:flex-none
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5 rounded-full text-sm font-semibold
                  border-2 border-[var(--color-border)]
                  text-[var(--color-text-secondary)]
                  hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]
                  hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                🗑️ Cancelar
              </button>

              <button
                onClick={analisar}
                className="
                  flex-1 sm:flex-none
                  inline-flex items-center justify-center gap-2
                  px-7 py-2.5 rounded-full text-sm font-bold
                  bg-gradient-to-br from-[var(--color-primary)] to-[#2ba882]
                  text-white
                  shadow-[var(--shadow-btn)]
                  hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)]
                  hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                ✨ Analisar Agora
              </button>
            </div>
          </div>
        )}

        {carregando && (
          <div
            className="
              flex flex-col items-center justify-center
              py-20 text-center
              animate-[fadeSlideUp_0.4s_ease]
            "
            aria-live="polite"
            aria-label="Analisando imagem"
          >
            <div
              className="
                w-16 h-16 rounded-full mb-8
                border-4 border-[var(--color-border)]
                border-t-[var(--color-primary)]
                animate-spin
              "
            />
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Analisando imagem...
            </h3>
            <p className="text-[var(--color-text-secondary)] max-w-sm text-sm">
              Nossa IA está identificando o material e calculando o impacto
              ambiental.
            </p>
          </div>
        )}

        {sucesso && (
          <ResultadoSucesso data={data as ScanSucesso} onReset={resetar} />
        )}
        {insuficiente && (
          <ResultadoInsuficiente
            data={data as ScanInsuficiente}
            onReset={resetar}
          />
        )}
      </div>
    </main>
  );
}
