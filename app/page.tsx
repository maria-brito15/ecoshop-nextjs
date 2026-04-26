"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem?: string;
  image?: string;
  id_categoria?: number;
}

interface Categoria {
  id: number;
  nome: string;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.8s cubic-bezier(0.2,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.2,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  subtitle,
  title,
  description,
}: {
  subtitle: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="text-center max-w-[700px] mx-auto mb-16">
      <span className="block text-sm font-bold text-[#2d9569] uppercase tracking-widest mb-2">
        {subtitle}
      </span>
      <h2 className="text-4xl font-extrabold text-[#1a3a2e] mb-4 leading-tight">
        {title}
      </h2>
      {description && <p className="text-[#5a7a6f] text-lg">{description}</p>}
    </Reveal>
  );
}

function ProductCard({
  produto,
  categorias,
}: {
  produto: Produto;
  categorias: Categoria[];
}) {
  const categoryName =
    categorias.find((c) => c.id === produto.id_categoria)?.nome ?? "Eco";
  const imgUrl =
    produto.image ??
    produto.imagem ??
    "https://via.placeholder.com/400x300/e8f5e8/28a745?text=EcoShop";
  const price = Number(produto.preco ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (
    <Link
      href={`/produtos/${produto.id}`}
      className="group bg-white border border-[#e3ede8] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#2d9569]"
    >
      <div className="h-60 bg-gradient-to-br from-[#f7faf8] to-white flex items-center justify-center p-4 relative overflow-hidden">
        <span className="absolute top-3 left-3 bg-[#e6f5ef] text-[#2d9569] text-xs font-bold px-3 py-1 rounded-full">
          Novo
        </span>
        <img
          src={imgUrl}
          alt={produto.nome}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x300/e8f5e8/28a745?text=EcoShop";
          }}
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="text-xs font-bold text-[#8fa89e] uppercase tracking-widest mb-1">
          {categoryName}
        </span>
        <h3 className="text-base font-bold text-[#1a3a2e] leading-snug mb-auto">
          {produto.nome}
        </h3>
        <p className="text-xl font-extrabold text-[#2d9569] mt-4">{price}</p>
      </div>
    </Link>
  );
}

function CategoryCard({ categoria }: { categoria: Categoria }) {
  const iconMap: Record<string, string> = {
    casa: "🏠",
    home: "🏠",
    beleza: "🌸",
    corpo: "🌸",
    moda: "👕",
    roupa: "👕",
    pet: "🐾",
  };
  const icon =
    Object.entries(iconMap).find(([key]) =>
      categoria.nome.toLowerCase().includes(key),
    )?.[1] ?? "🌿";
  return (
    <Link
      href={`/produtos?categoria=${categoria.id}`}
      className="group bg-white border border-[#e3ede8] rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2d9569] hover:shadow-lg"
    >
      <div className="w-14 h-14 bg-[#e6f5ef] rounded-full flex items-center justify-center text-2xl mx-auto mb-5 transition-all duration-300 group-hover:bg-[#2d9569] group-hover:rotate-12 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-bold text-[#1a3a2e] text-base">{categoria.nome}</h3>
    </Link>
  );
}

export default function LandingPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const productsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/produtos"),
          fetch("/api/categorias"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProdutos((prodData.products ?? prodData).slice(0, 8));
        setCategorias(catData.slice(0, 6));
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main className="bg-[#f7faf8] text-[#1a3a2e] font-sans">
      {/* HERO */}
      <section
        id="home"
        className="pt-16 pb-24 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(45,149,105,0.03) 0%, transparent 20%), radial-gradient(circle at 90% 90%, rgba(45,149,105,0.03) 0%, transparent 20%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#e6f5ef] text-[#1d5d3f] rounded-full font-semibold text-sm mb-6">
                🌿 Consumo Consciente
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] text-[#1a3a2e] mb-6">
                Sua escolha <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, #2d9569 0%, #1d5d3f 100%)",
                  }}
                >
                  faz a diferença
                </span>
              </h1>
              <p className="text-xl text-[#5a7a6f] mb-10 max-w-[90%] leading-relaxed">
                Descubra produtos sustentáveis que cuidam de você e do planeta.
                Cada compra é um passo em direção a um futuro mais verde e
                ético.
              </p>
              <div className="flex gap-4 mb-12">
                <button
                  onClick={() =>
                    productsRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center gap-2 bg-[#2d9569] hover:bg-[#237852] text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-none"
                  style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
                >
                  Explorar Produtos <span>→</span>
                </button>
              </div>
              <div className="flex items-center gap-8 pt-8 border-t border-[#e3ede8]">
                {[
                  { value: "+10", label: "Produtos Eco" },
                  { value: "100%", label: "Carbono Neutro" },
                  { value: "4.9", label: "Avaliação Geral" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-8">
                    {i > 0 && <div className="w-px h-10 bg-[#e3ede8]" />}
                    <div className="flex flex-col">
                      <strong className="text-2xl font-extrabold text-[#1a3a2e]">
                        {stat.value}
                      </strong>
                      <span className="text-sm text-[#8fa89e]">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200} className="relative">
              <div
                className="relative rounded-[2rem] overflow-hidden"
                style={{
                  boxShadow: "0 16px 48px rgba(26,58,46,0.16)",
                  transform: "perspective(1000px) rotateY(-5deg)",
                  transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "perspective(1000px) rotateY(0deg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "perspective(1000px) rotateY(-5deg)";
                }}
              >
                <div
                  className="absolute top-[30px] right-[30px] z-10 bg-white/90 backdrop-blur-sm border border-[#e3ede8] px-5 py-3 rounded-xl flex items-center gap-2 font-semibold text-[#1a3a2e] shadow-lg"
                  style={{ animation: "float 3s ease-in-out infinite" }}
                >
                  <span className="text-[#2d9569]">🏅</span>
                  <span>Certificado</span>
                </div>
                <div
                  className="absolute bottom-[30px] left-[30px] z-10 bg-white/90 backdrop-blur-sm border border-[#e3ede8] px-5 py-3 rounded-xl flex items-center gap-2 font-semibold text-[#1a3a2e] shadow-lg"
                  style={{ animation: "float 3s ease-in-out infinite 1.5s" }}
                >
                  <span className="text-[#2d9569]">♻️</span>
                  <span>Reciclável</span>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Estilo de vida sustentável EcoShop"
                  className="w-full block"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section ref={productsRef} id="produtos" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <SectionHeader
            subtitle="Nossa Seleção"
            title="Melhores Produtos"
            description="Curadoria especial de itens que unem design, funcionalidade e sustentabilidade."
          />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-[#f7faf8] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : apiError ? (
            <div className="text-center py-16">
              <p className="text-[#5a7a6f] mb-4">
                Não foi possível conectar ao servidor.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="border-2 border-[#e3ede8] text-[#1a3a2e] px-6 py-2 rounded-full hover:border-[#2d9569] hover:text-[#2d9569] transition-all duration-200 cursor-pointer bg-transparent"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {produtos.map((p) => (
                <ProductCard key={p.id} produto={p} categorias={categorias} />
              ))}
            </div>
          )}
          <div className="text-center mt-4">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 border-2 border-[#e3ede8] text-[#1a3a2e] px-8 py-3.5 rounded-full font-semibold hover:border-[#2d9569] hover:text-[#2d9569] transition-all duration-200"
            >
              Ver Todos os Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section id="categorias" className="py-20 bg-[#f7faf8]">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <SectionHeader subtitle="Navegue por" title="Categorias Principais" />
          {categorias.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {categorias.map((c) => (
                <CategoryCard key={c.id} categoria={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EDUCATIVO */}
      <section
        id="educativo"
        className="py-20 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a3a2e 0%, #0f2419 100%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="block text-[#2d9569] font-bold uppercase tracking-widest text-sm mb-4">
                  Aprenda
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Centro Educativo EcoShop
                </h2>
                <p className="text-[#a5c3b6] text-lg mb-10 leading-relaxed">
                  A sustentabilidade vai além da compra. Acesse nossos guias e
                  aprenda como suas pequenas atitudes diárias transformam o
                  mundo.
                </p>
                <div className="space-y-6 mb-10">
                  {[
                    {
                      icon: "📚",
                      title: "Guias Práticos",
                      desc: "Dicas para reduzir resíduos em casa.",
                    },
                    {
                      icon: "🌱",
                      title: "Impacto Real",
                      desc: "Entenda o ciclo de vida dos produtos.",
                    },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {f.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1">{f.title}</h3>
                        <p className="text-[#a5c3b6] text-sm">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/educacao"
                  className="inline-flex items-center gap-2 bg-[#2d9569] hover:bg-[#237852] text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                  style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
                >
                  Acessar Conteúdo Educativo
                </Link>
              </div>
              <div className="relative h-[500px] hidden lg:block">
                <div
                  className="absolute inset-0 rounded-[2rem] overflow-hidden"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                  }}
                />
                <div className="absolute bottom-8 -right-4 bg-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
                  <span className="text-3xl">🌍</span>
                  <span className="font-bold text-[#1a3a2e] whitespace-nowrap">
                    Juntos pelo planeta
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "linear-gradient(135deg, #1a3a2e 0%, #0f2419 100%)",
          color: "white",
          paddingTop: "3rem",
          paddingBottom: "1rem",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#2d9569] text-4xl">🌿</span>
                <span className="text-3xl font-extrabold">EcoShop</span>
              </div>
              <p className="text-[#a5c3b6] text-sm leading-relaxed mb-6">
                Sua loja online de produtos sustentáveis. Conectando você a um
                futuro mais verde.
              </p>
              <div className="flex gap-3">
                {["📷", "👥", "▶️"].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-[#2d9569] rounded-full flex items-center justify-center transition-all duration-300"
                  >
                    <span className="text-sm">{icon}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-4">
                Links Rápidos
              </h3>
              <ul className="space-y-3">
                {[
                  { label: "Início", href: "/" },
                  { label: "Produtos", href: "/produtos" },
                  { label: "Educação", href: "/educacao" },
                  { label: "IA Scan", href: "/ia-scan" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#a5c3b6] hover:text-[#2d9569] transition-colors duration-200 flex items-center gap-2 text-sm"
                    >
                      <span className="text-xs">›</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-4">Contato</h3>
              <ul className="space-y-3 text-sm text-[#a5c3b6]">
                {[
                  { icon: "✉", text: "contato@ecoshop.com" },
                  { icon: "☎", text: "(11) 9999-9999" },
                  { icon: "📍", text: "São Paulo, SP\nBrasil" },
                ].map((item) => (
                  <li key={item.icon} className="flex items-start gap-3">
                    <span className="text-[#2d9569] mt-0.5">{item.icon}</span>
                    <span style={{ whiteSpace: "pre-line" }}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-[#a5c3b6] text-sm">
            <p>
              © 2024 EcoShop. Todos os direitos reservados. Feito com{" "}
              <span className="text-[#2d9569]">♥</span> para um planeta melhor.
            </p>
          </div>
        </div>
      </footer>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
    </main>
  );
}
