// app/page.tsx — página inicial (home) do EcoShop

"use client"; // página interativa: usa useState, useEffect e fetch no browser

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  Produto,
  Categoria,
  ListaProdutosResponse,
  ListaCategoriasResponse,
} from "@/types/api";

// retorna um emoji baseado no nome da categoria
// usado nos cards de categoria para deixar a UI mais visual
function categoryIcon(nome: string) {
  const n = nome.toLowerCase();

  if (n.includes("casa") || n.includes("home")) return "🏠";
  if (n.includes("beleza") || n.includes("corpo")) return "🌿";
  if (n.includes("moda") || n.includes("roupa")) return "👕";
  if (n.includes("pet")) return "🐾";

  return "🍃"; // emoji padrão se não bater com nenhuma categoria conhecida
}

// hook customizado que observa elementos com a classe "animate-on-scroll"
// quando o elemento entra na viewport, adiciona a classe "visible" (definida no globals.css)
// isso cria o efeito de fade-in + slide-up ao rolar a página
function useScrollReveal() {
  useEffect(() => {
    // setTimeout de 100ms garante que o DOM já está montado antes de observar
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target); // para de observar após animar (anima só uma vez)
            }
          });
        },
        { threshold: 0.1 }, // dispara quando pelo menos 10% do elemento está visível
      );

      const elements = document.querySelectorAll(".animate-on-scroll");
      console.log(`🎬 Observando ${elements.length} elementos para animação`);

      elements.forEach((el) => {
        observer.observe(el);
        // se o elemento já está visível no carregamento (sem precisar rolar), anima imediatamente
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");

          console.log(
            `✨ Elemento já visível, adicionando classe: ${el.className}`,
          );
        }
      });

      return () => observer.disconnect(); // cleanup ao desmontar
    }, 100);

    return () => clearTimeout(timer);
  }, []);
}

// card individual de produto
// recebe um produto e renderiza imagem, categoria, marca, nome e preço
function ProductCard({ produto }: { produto: Produto }) {
  // formata o preço para o padrão brasileiro: R$ 1.299,90
  const precoFormatado = parseFloat(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <article className="product-card animate-on-scroll cursor-pointer visible">
      {/* área da imagem com badge de categoria no canto */}
      <div className="h-48 flex items-center justify-center bg-[var(--color-bg-body)] relative overflow-hidden">
        {produto.fotoUrl ? (
          <img
            src={produto.fotoUrl}
            alt={produto.nome}
            className="card-img w-full h-full object-cover"
          />
        ) : (
          // fallback: emoji quando o produto não tem foto cadastrada
          <span className="card-img text-6xl select-none">🌱</span>
        )}

        {/* badge com o nome da categoria, posicionado no canto superior esquerdo */}
        <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
          {produto.categoria.nome}
        </span>
      </div>

      {/* área de texto: marca, nome e preço */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {/* nome da marca em destaque menor acima do título */}
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {produto.marca.nome}
        </span>

        {/* nome do produto com clamp: trunca em 2 linhas se for muito longo */}
        <h3 className="font-bold text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {produto.nome}
        </h3>

        {/* preço funciona como link para a página do produto */}
        {/* mt-auto empurra o preço para o fundo do card, alinhando todos os cards */}
        <Link
          href={`/produtos/${produto.id}`}
          className="mt-auto pt-3 text-lg font-extrabold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          {precoFormatado}
        </Link>
      </div>
    </article>
  );
}

// card de categoria que leva para a lista de produtos filtrada por c
// ategoria
// ao clicar, redireciona para /produtos?categoriaId=X
function CategoryCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link
      href={`/produtos?categoriaId=${categoria.id}`}
      className="
        animate-on-scroll group w-full visible
        flex flex-col items-center gap-3
        p-6 rounded-[var(--radius-card)] text-center
        bg-[var(--color-bg-surface)]
        border border-[var(--color-border)]
        hover:border-[var(--color-primary)]
        hover:-translate-y-1
        hover:shadow-[var(--shadow-card)]
        transition-all duration-300
      "
    >
      {/* ícone da categoria: fundo muda para verde sólido no hover */}
      {/* "group" no pai permite que o filho reaja ao hover do pai com "group-hover:" */}
      <span
        className="
          text-3xl w-14 h-14
          flex items-center justify-center rounded-full
          bg-[var(--color-primary-light)]
          group-hover:bg-[var(--color-primary)]
          transition-colors
        "
      >
        {categoryIcon(categoria.nome)}
      </span>

      <span className="font-bold text-[var(--color-text-primary)]">
        {categoria.nome}
      </span>
    </Link>
  );
}

// componente principal da home
export default function HomePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ativa o observer de animações ao montar a página
  useScrollReveal();

  // busca produtos e categorias ao carregar a página
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErro(null);

        // busca apenas 4 produtos para a seção de destaques da home
        const prodRes = await fetch("/api/produtos?size=4");
        if (!prodRes.ok)
          throw new Error(`Erro ao buscar produtos: ${prodRes.status}`);
        const prodData = (await prodRes.json()) as ListaProdutosResponse;

        // busca todas as categorias para a seção de navegação
        const catRes = await fetch("/api/categorias");
        if (!catRes.ok)
          throw new Error(`Erro ao buscar categorias: ${catRes.status}`);
        const catData = (await catRes.json()) as ListaCategoriasResponse;

        // fallback com || [] evita erro se a API retornar undefined inesperadamente
        setProdutos(prodData.produtos || []);
        setCategorias(catData.categorias || []);
      } catch (err: any) {
        setErro(err.message || "Ocorreu um erro ao carregar os dados.");
      } finally {
        setLoading(false); // sempre executa, com sucesso ou erro
      }
    };

    fetchData();
  }, []); // array vazio = executa só uma vez, quando a página monta

  // log auxiliar para debug: exibe o estado atual sempre que ele mudar
  useEffect(() => {
    console.log(
      "🎯 Estado: loading=",
      loading,
      "produtos=",
      produtos.length,
      "categorias=",
      categorias.length,
    );
  }, [loading, produtos, categorias]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* ===== SEÇÃO HERO ===== */}
      {/* apresentação principal do site com chamada para ação */}
      <section
        className="
          py-20 md:py-32 bg-[var(--color-bg-body)]
          [background-image:radial-gradient(circle_at_10%_10%,rgba(45,149,105,0.05)_0%,transparent_25%),radial-gradient(circle_at_90%_90%,rgba(45,149,105,0.04)_0%,transparent_25%)]
        "
        // gradientes radiais sutis nos cantos para dar profundidade ao fundo
      >
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* coluna esquerda: texto e botões */}
            <div className="flex flex-col gap-6">
              <span className="badge-eco w-fit">🌿 Compras conscientes</span>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
                Sua escolha{" "}
                {/* text-gradient-eco aplica o gradiente verde no texto (globals.css) */}
                <span className="text-gradient-eco">faz a diferença</span>
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-lg">
                Descubra produtos sustentáveis que cuidam de você e do planeta,
                com entrega rápida e propósito real.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/produtos" className="btn-primary">
                  Explorar Produtos
                </Link>
                <Link href="/educacao" className="btn-secondary">
                  Aprender mais
                </Link>
              </div>

              {/* métricas de confiança renderizadas dinamicamente */}
              <div className="flex gap-8 pt-6 border-t border-[var(--color-border)]">
                {[
                  { valor: "2k+", label: "Produtos eco" },
                  { valor: "98%", label: "Satisfação" },
                  { valor: "0 CO₂", label: "Entregas neutras" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <strong className="text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
                      {s.valor}
                    </strong>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* coluna direita: banner (hidden em mobile, visível só em lg+) */}
            <div className="hidden lg:flex items-center justify-center h-96 rounded-3xl overflow-hidden relative bg-[var(--color-primary-light)] border border-[var(--color-border)]">
              <img
                src="/banner.png"
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* selo flutuando sobre a imagem */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-2xl border border-[var(--color-border)]">
                ✅ Certificado Eco-Friendly
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO PRODUTOS ===== */}
      {/* 3 estados possíveis: loading (skeleton) → erro → dados ou vazio */}
      <section id="produtos" className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Destaques
            </span>
            <h2 className="font-display text-4xl font-extrabold mb-3">
              Melhores Produtos
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Selecionados com cuidado para você e para o planeta.
            </p>
          </div>

          {loading ? (
            // skeleton: 4 retângulos pulsando enquanto os dados carregam
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-[var(--radius-card)] bg-[var(--color-bg-body)] animate-pulse"
                />
              ))}
            </div>
          ) : erro ? (
            // estado de erro com botão para tentar novamente
            <div className="text-center py-12">
              <p className="text-[var(--color-error)] font-semibold mb-2">
                Ops! Algo deu errado.
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">
                {erro}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-[var(--color-primary)] hover:underline font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : Array.isArray(produtos) && produtos.length > 0 ? (
            // sucesso: grid de cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtos.map((p) => (
                <ProductCard key={p.id} produto={p} />
              ))}
            </div>
          ) : (
            // lista vazia
            <p className="text-center text-[var(--color-text-tertiary)] py-12">
              Nenhum produto encontrado.
            </p>
          )}

          <div className="text-center mt-10">
            <Link href="/produtos" className="btn-secondary">
              Ver todos os produtos →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO CATEGORIAS ===== */}
      {/* && garante que só renderiza se houver categorias */}
      {Array.isArray(categorias) && categorias.length > 0 && (
        <section className="py-20 bg-[var(--color-bg-body)]">
          <div className="container-eco">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                Navegue por
              </span>
              <h2 className="font-display text-4xl font-extrabold">
                Categorias
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 justify-items-center mx-auto max-w-5xl">
              {/* slice(0, 6): exibe no máximo 6 categorias na home */}
              {categorias.slice(0, 6).map((cat) => (
                <CategoryCard key={cat.id} categoria={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== SEÇÃO EDUCAÇÃO ===== */}
      {/* fundo escuro verde para contraste visual com as seções anteriores */}
      <section className="py-20 bg-[linear-gradient(135deg,#1a3a2e_0%,#0f2419_100%)] text-white">
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-on-scroll flex flex-col gap-6 visible">
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                Conhecimento
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
                Centro Educativo EcoShop
              </h2>
              <p className="text-[#a5c3b6] text-lg">
                Acesse nossos guias e aprenda como suas pequenas atitudes
                transformam o mundo.
              </p>

              {/* features renderizadas dinamicamente */}
              {[
                {
                  icon: "📖",
                  title: "Guias Práticos",
                  desc: "Aprenda a reduzir seu lixo doméstico.",
                },
                {
                  icon: "🌱",
                  title: "Sustentabilidade",
                  desc: "Entenda o impacto real de cada material.",
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 items-start">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <h4 className="font-bold text-white">{f.title}</h4>
                    <p className="text-sm text-[#a5c3b6]">{f.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="/educacao" className="btn-primary w-fit mt-2">
                Acessar Conteúdo Educativo
              </Link>
            </div>
            {/* decorativo: só aparece em telas grandes */}
            <div className="animate-on-scroll hidden lg:flex items-center justify-center h-80 rounded-3xl text-9xl bg-white/5 border border-white/10 visible">
              📚
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO ECOSCAN ===== */}
      {/* banner verde de CTA para a funcionalidade de IA */}
      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="animate-on-scroll flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl bg-[var(--color-primary)] relative overflow-hidden visible">
            {/* gradiente decorativo de fundo (pointer-events-none = não intercepta cliques) */}
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,white_0%,transparent_60%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3 text-white">
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Inteligência Artificial
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">
                EcoScan IA
              </h2>
              <p className="text-white/80 max-w-md">
                Use nossa IA para identificar resíduos e descobrir o descarte
                correto.
              </p>
            </div>
            {/* botão com estilo invertido: branco sobre verde */}
            <Link
              href="/ia-scan"
              className="relative z-10 flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-primary-dark)] font-bold rounded-full hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              🔍 Testar Agora
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-16">
        <div className="container-eco">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* coluna da marca: ocupa 2 colunas no grid */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="font-display text-2xl font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
                🍃 EcoShop
              </span>
              <p className="text-[var(--color-text-secondary)] max-w-sm">
                Conectamos pessoas a produtos sustentáveis, facilitando escolhas
                conscientes.
              </p>
              <div className="flex gap-3">
                {["Instagram", "Twitter", "YouTube"].map((r) => (
                  <a
                    key={r}
                    href="#"
                    aria-label={r} // aria-label garante acessibilidade para leitores de tela
                    className="w-9 h-9 flex items-center justify-center rounded-full text-sm bg-[var(--color-bg-body)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                  >
                    {r[0]} {/* exibe só a inicial: I, T, Y */}
                  </a>
                ))}
              </div>
            </div>

            {/* colunas de links geradas dinamicamente a partir de um array */}
            {[
              {
                title: "Loja",
                links: [
                  { label: "Produtos", href: "/produtos" },
                  { label: "Categorias", href: "/produtos" },
                  { label: "Novidades", href: "/produtos" },
                ],
              },
              {
                title: "Empresa",
                links: [
                  { label: "Sobre nós", href: "/about" },
                  { label: "Educação", href: "/educacao" },
                  { label: "EcoScan IA", href: "/ia-scan" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-bold text-[var(--color-text-primary)] mb-4">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {/* hover:pl-1 desloca o link levemente para a direita no hover */}
                      <Link
                        href={l.href}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:pl-1 transition-all"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* linha inferior: copyright + ícones */}
          <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
            {/* getFullYear() garante que o ano é sempre o atual automaticamente */}
            <span>
              © {new Date().getFullYear()} EcoShop. Todos os direitos
              reservados.
            </span>
            <span className="flex gap-2 text-xl opacity-60">💳 🔒 ♻️</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
